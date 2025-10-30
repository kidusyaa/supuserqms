// Supabase utilities - Complete replacement for firebase-utils.ts
import { supabase } from './supabaseClient';
import type { 
  Company, 
  Service, 
  QueueItem, 
  User, 
  Category, 
  CompanyType,
  Provider, 
  Booking,
  BookingStatus, 
  QueueEntryStatus,
  MessageTemplate, 
  Location,
  LocationOption,
  GlobalStatsData,
  FilterState, 
  CompanyTypeWithCount,
  AugmentedQueueItem
} from '../type';
import { addMinutes, isAfter, max, min, startOfDay, endOfDay, isBefore, format, getDay, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
export type CategoryWithServices = Category & {
  services: Service[];
};
import { parseWorkingHours, getDayRange, generateAvailableSlots } from './booking-utils';

const SERVICE_IMAGES_BUCKET = 'service-images';

  // The main function to create a new queue entry
 export type CreateQueuePayload = {
  user_name: string;
  phone_number: string;
  service_id: string;
  provider_id: string | null; // Can be null if 'Any Provider' is chosen
  queue_type: 'walk-in' | 'booking';
  appointment_time?: string | null; 
  notes?: string | null; 
};

// Helper to convert database rows to our Provider type
const mapToProvider = (providerData: any): Provider => ({
    id: providerData.id,
    name: providerData.name,
    specialization: providerData.specialization || null,
    is_active: providerData.is_active,
    created_at: providerData.created_at, 
    company_id: providerData.company_id, // Ensure this column exists in your providers table
});

// Helper to convert database rows to our Service type
const mapToService = (serviceData: any): Service => ({
    id: serviceData.id,
    company_id: serviceData.company_id,
    name: serviceData.name,
    category_id: serviceData.category_id,
    description: serviceData.description || null,
    estimated_wait_time_mins: serviceData.estimated_wait_time_mins || null,
    status: serviceData.status,
    code: serviceData.code || null,
    created_at: serviceData.created_at, 
    price: serviceData.price ? String(serviceData.price) : null,
    photo: serviceData.photo || null,
    featureEnabled: serviceData.featureEnabled === true, // Ensure it's a boolean, default to false if null/undefined
    discount_type:serviceData.discount_type,
    discount_value:serviceData.discount_value
});

// Helper to convert database rows to our Company type
const mapToCompany = (companyData: any): Company => ({
    id: companyData.id,
    name: companyData.name,
    phone: companyData.phone || null,
    email: companyData.email || null,
    address: companyData.address || null,
    working_hours: companyData.working_hours || null,
    logo: companyData.logo || null,
    location_text: companyData.location_text || null,
    location_link: companyData.location_link || null,
    owner_uid: companyData.owner_uid,
    created_at: companyData.created_at || null, 
    socials: companyData.socials || null,
});


// ===== LOCATIONS =====
export const getLocations = async (): Promise<Location[]> => {
  try {
    const { data, error } = await supabase
      .from('global_locations')
      .select('*');

    if (error) {
      console.error('Error getting locations:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error getting locations:', error);
    return [];
  }
};

// ===== CATEGORIES =====
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error getting categories:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error getting categories:', error);
    return [];
  }
};

export const getHierarchicalCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error getting hierarchical categories:', error);
      return [];
    }

    // Build hierarchical structure
    const categories = data || [];
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // First pass: create map and identify root categories
    categories.forEach(category => {
      categoryMap.set(category.id, category);
      if (!category.parent_category_id) {
        rootCategories.push(category);
      }
    });

    // Second pass: build hierarchy
    const buildHierarchy = (parent: Category): Category[] => {
      const children = categories
        .filter(cat => cat.parent_category_id === parent.id)
        .map(child => ({ ...child, children: buildHierarchy(child) }));
      
      return children.length > 0 ? children : [];
    };

    return rootCategories.map(root => ({
      ...root,
      children: buildHierarchy(root)
    }));
  } catch (error) {
    console.error('Error getting hierarchical categories:', error);
    return [];
  }
};

export const getCategoryById = async (id: string): Promise<Category | null> => {
  try {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error getting category by ID:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error getting category by ID:', error);
    return null;
  }
};

// ===== COMPANY TYPES =====
export const getAllCompanyTypes = async (): Promise<CompanyType[]> => {
  try {
    const { data, error } = await supabase
      .from('company_types')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error getting company types:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error getting company types:', error);
    return [];
  }
};

export const getCompanyTypeOptions = async (): Promise<LocationOption[]> => {
  try {
    const companyTypes = await getAllCompanyTypes();
    return companyTypes.map((companyType) => ({
      id: companyType.id,
      value: companyType.id,
      label: companyType.name,
    }));
  } catch (error) {
    console.error("Error getting company type options:", error);
    return [];
  }
};

// Get categories that are available for selected company types
export const getCategoriesByCompanyTypes = async (companyTypeIds: string[]): Promise<Category[]> => {
  try {
    if (companyTypeIds.length === 0) {
      // If no company types selected, return all categories
      return await getAllCategories();
    }

    const { data, error } = await supabase
      .from('company_type_service_category_mapping')
      .select(`
        service_category_id,
        service_categories (
          *
        )
      `)
      .in('company_type_id', companyTypeIds);

    if (error) {
      console.error('Error getting categories by company types:', error);
      return [];
    }

    // Extract unique categories
    const categoryMap = new Map<string, Category>();
    (data || []).forEach((item: any) => {
      if (item.service_categories) {
        categoryMap.set(item.service_categories.id, item.service_categories);
      }
    });

    return Array.from(categoryMap.values());
  } catch (error) {
    console.error('Error getting categories by company types:', error);
    return [];
  }
};

// ===== SERVICES =====
export const getServiceWithProviders = async (
  companyId: string, 
  serviceId: string
): Promise<Service | null> => {
  try {
    const { data: service, error } = await supabase
      .from('services')
      .select(`
        *,
        service_providers (
          providers (*)
        )
      `)
      .eq('id', serviceId)
      .eq('company_id', companyId)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Error getting service with providers:', error?.message);
      return null;
    }

    if (!service) return null;

    const providers = service.service_providers
      ? service.service_providers
          .map((sp: any) => mapToProvider(sp.providers))
          .filter(Boolean) as Provider[]
      : [];

    const mappedService = mapToService(service);

    return {
      ...mappedService,
      providers: providers,
    } as Service;
  } catch (error) {
    console.error('Error getting service with providers:', error);
    return null;
  }
};


export const getAllServices = async (): Promise<Service[]> => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          company:companies (
            id,
            name,
            location_text
          ),
          service_providers (
            providers ( * )
          ),
          service_photos ( url )
        `)
        .eq('status', 'active');
  
      if (error) {
        console.error('Error fetching all services:', error);
        throw error; // It's better to throw the error to be handled by the caller
      }
  
      if (!data) {
        return [];
      }
  
      // --- THE FIX ---
      // Instead of a complex map, we just clean up the nested providers.
      // The rest of the data is already in the correct shape thanks to the query.
      const servicesWithProviders = data.map((service: any) => {
        const providers = service.service_providers
          ? service.service_providers.map((sp: any) => sp.providers).filter(Boolean)
          : [];
        
        // Map first service photo url to photo field for uniform consumption
        const photoUrl = service.service_photos?.[0]?.url || service.photo || null;

        // We can delete the temporary join table data if we want a clean object
        delete service.service_providers;
        if (service.service_photos) delete service.service_photos;
  
        return {
          ...service,
          photo: photoUrl,
          providers: providers,
        };
      });
  
      return servicesWithProviders as Service[];
  
    } catch (error) {
      console.error('Error in getAllServices function:', error);
      return []; // Return empty array on failure
    }
  };
export const getAllServicesByCategory = async (categoryId: string): Promise<Service[]> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        companies (*),
        service_providers (
          providers (*)
        )
      `)
      .eq('category_id', categoryId)
      .eq('status', 'active');

    if (error) {
      console.error('Error getting services by category:', error);
      return [];
    }

    return (data || []).map((service: any) => ({
      ...service,
      companyId: service.company_id,
      categoryId: service.category_id,
      estimatedWaitTime: service.estimated_wait_time,
      allowWalkIns: service.allow_walk_ins,
      walkInBuffer: service.walk_in_buffer,
      maxWalkInsPerHour: service.max_walk_ins_per_hour,
      featureEnabled: service.feature_enabled,
      locationLink: service.location_link,
      createdAt: new Date(service.created_at),
      company: service.companies,
      providers: service.service_providers
        ? service.service_providers
            .map((sp: any) => sp.providers)
            .filter(Boolean)
        : []
    })) as Service[];
  } catch (error) {
    console.error('Error getting services by category:', error);
    return [];
  }
};

export const getGlobalCategoriesWithServiceCounts = async (): Promise<Category[]> => {
  try {
    const { data: categories, error: categoriesError } = await supabase
      .from('service_categories')
      .select('*');

    if (categoriesError) {
      console.error('Error getting categories:', categoriesError);
      return [];
    }

    // Get service counts for each category
    const { data: serviceCounts, error: countsError } = await supabase
      .from('services')
      .select('category_id')
      .eq('status', 'active');

    if (countsError) {
      console.error('Error getting service counts:', countsError);
      return categories || [];
    }

    // Count services by category
    const countMap = new Map<string, number>();
    (serviceCounts || []).forEach((service: any) => {
      if (service.category_id) {
        const current = countMap.get(service.category_id) || 0;
        countMap.set(service.category_id, current + 1);
      }
    });

    return (categories || []).map((category: any) => ({
      ...category,
      services: countMap.get(category.id) || 0
    }));
  } catch (error) {
    console.error('Error getting categories with service counts:', error);
    return [];
  }
};

// ===== SEARCH FUNCTIONS =====
export const searchServices = async (searchTerm: string, categoryId?: string): Promise<Service[]> => {
  try {
    let query = supabase
      .from('services')
      .select(`
        *,
        companies (*)
      `)
      .eq('status', 'active');

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error searching services:', error);
      return [];
    }

    const services = (data || []).map((service: any) => ({
      ...service,
      companyId: service.company_id,
      categoryId: service.category_id,
      estimatedWaitTime: service.estimated_wait_time,
      allowWalkIns: service.allow_walk_ins,
      walkInBuffer: service.walk_in_buffer,
      maxWalkInsPerHour: service.max_walk_ins_per_hour,
      featureEnabled: service.feature_enabled,
      locationLink: service.location_link,
      createdAt: new Date(service.created_at),
      company: service.companies
    })) as Service[];

    // Filter by search term
    const q = searchTerm.trim().toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return services;

    const matches = (text?: string) =>
      text ? tokens.some(t => text.toLowerCase().includes(t)) : false;

    return services.filter(service =>
      matches(service.name) ||
      matches(service.code) ||
      matches((service as any).company?.name) ||
      matches(service.description)
    );
  } catch (error) {
    console.error('Error searching services:', error);
    return [];
  }
};

// Featured services: status active AND featureEnabled true
export async function getDiscountedServices(): Promise<Service[]> {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        company:companies (
          name,
          location_text
        ),
        service_category:service_categories (
          name
        ),
        service_photos (
          url
        )
      `)
      .eq('status', 'active')
      .not('discount_type', 'is', null) // Ensure there is a discount
      .not('discount_value', 'is', null);

    if (error) {
      console.error("Error fetching discounted services:", error);
      throw error;
    }
    
    // The query already returns the data in the shape we need.
    return data || [];

  } catch (error) {
    console.error("Error in getDiscountedServices function:", error);
    return [];
  }
};

// Global stats for the landing page
export const getGlobalStats = async (): Promise<GlobalStatsData> => {
  try {
    const [companiesResult, servicesResult, completedResult, usersResult] = await Promise.all([
      supabase.from('companies').select('id', { count: 'exact', head: true }),
      supabase.from('services').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('queue_entries').select('id', { count: 'exact', head: true }).eq('status', 'served'),
      supabase.from('users').select('id', { count: 'exact', head: true })
    ]);

    return {
      companiesCount: companiesResult.count || 0,
      activeServicesCount: servicesResult.count || 0,
      servicesCompletedCount: completedResult.count || 0,
      usersCount: usersResult.count || 0,
    };
  } catch (error) {
    console.error('Error getting global stats:', error);
    return { 
      companiesCount: 0, 
      activeServicesCount: 0, 
      servicesCompletedCount: 0, 
      usersCount: 0 
    };
  }
};

// ===== COMPANIES =====
export const getAllCompanies = async (): Promise<Company[]> => {
  try {
    // This query now joins with the company_types table
    // through your join table (which Supabase handles automatically
    // if relationships are set up correctly).
    const { data, error } = await supabase
      .from('companies')
      .select(`
        *,
        company_types (*)
      `);

    if (error) {
      console.error('Error getting all companies with types:', error?.message);
      return [];
    }

    // No mapping needed if the query returns the shape we want
    return data || []; 
  } catch (error) {
    console.error('Error in getAllCompanies function:', error);
    return [];
  }
};

export const getCompanyOptions = async (): Promise<LocationOption[]> => {
  try {
    const companies = await getAllCompanies();
    return companies.map((company) => ({
      id: company.id,
      value: company.id,
      label: company.name,
    }));
  } catch (error) {
    console.error("Error getting company options:", error);
    return [];
  }
};

// In your user-facing API file (e.g., src/lib/supabase-utils.ts)

/**
 * Fetches a single service with ALL its related data (company and providers).
 * This version fetches all providers, regardless of their active status.
 */
// In your user-facing API file (e.g., src/lib/supabase-utils.ts)


/**
 * Fetches a single service with ALL its related data (company and providers).
 * This version fetches all providers, regardless of their active status.
 */
  export const getServiceDetails = async (serviceId: string): Promise<Service | null> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        company:companies (*),
        service_providers (
          providers (*)
        ),
        service_photos (
          url
        )
      `) // <-- CORRECTED QUERY STRUCTURE
      .eq('id', serviceId)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // This code means .single() found no rows
        console.log(`No active service found with ID: ${serviceId}`);
        return null;
      }
      console.error("Supabase query error in getServiceDetails:", error);
      throw error;
    }

    if (!data) {
      return null;
    }

    // --- CORRECTED DATA PROCESSING ---

    // 1. Cast the raw data for easier access
    const rawServiceData = data as any;

    // 2. Extract and map providers
    const providers: Provider[] = rawServiceData.service_providers
      ? rawServiceData.service_providers
          .map((sp: any) => sp.providers ? mapToProvider(sp.providers) : null)
          .filter(Boolean) // Remove any nulls if a provider relation was missing
      : [];

    // 3. Extract and map the company
    const company = rawServiceData.company ? mapToCompany(rawServiceData.company) : undefined;
    
    // 4. Extract the photo URL
    let publicPhotoUrl: string | null = null;
    if (rawServiceData.service_photos && rawServiceData.service_photos.length > 0) {
      publicPhotoUrl = rawServiceData.service_photos[0].url;
    }

    // 5. Construct the final Service object
    const service: Service = {
      ...mapToService(rawServiceData), // Map the base service properties
      photo: publicPhotoUrl,           // Add the processed photo URL
      providers: providers,            // Add the mapped providers
      company: company,                // Add the mapped company
    };

    return service;

  } catch (error) {
    console.error(`Error fetching service details for ID ${serviceId}:`, error);
    return null;
  }
};

const findOrCreateUser = async (phoneNumber: string, name: string): Promise<{ id: string }> => {
    // 1. Check if user exists
    let { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone_number', phoneNumber)
      .single();
  
    if (existingUser) {
      return existingUser;
    }
  
    // 2. If not, create them
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ phone_number: phoneNumber, name: name })
      .select('id')
      .single();
  
    if (error || !newUser) {
      throw new Error('Could not create user.');
    }
    
    return newUser;
  };
  
  


// In your Supabase utility file (e.g., src/lib/supabase-utils.ts)

// In your Supabase utility file (e.g., src/lib/supabase-utils.ts)

export const createQueueEntry = async (payload: CreateQueuePayload): Promise<QueueItem & {position: number}> => {
  try {
    // Only calculate position for 'walk-in' queues
    // For 'booking' queues, position might be less relevant or handled differently later
    const currentQueueCount = payload.queue_type === 'walk-in' ? await getCurrentQueueCount(payload.service_id) : 0;
    const position = currentQueueCount + 1;

    const { data, error } = await supabase
      .from('queue_entries')
      .insert({
        service_id: payload.service_id,
        provider_id: payload.provider_id, // This can now be null
        user_name: payload.user_name,
        phone_number: payload.phone_number,
        queue_type: payload.queue_type,
        status: 'waiting', // Default status for new entries
        appointment_time: payload.appointment_time,
        notes: payload.notes,
        // The `joined_at` column in your DB should have a `DEFAULT NOW()`
        // Supabase will automatically populate `created_at` which we can map to `joined_at`
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating queue entry:', error);
      throw new Error(`Failed to join queue: ${error.message}`);
    }

    if (!data) {
        throw new Error('Failed to retrieve new queue entry after creation.');
    }

    const queueItem: QueueItem = {
        id: data.id,
        service_id: data.service_id,
        provider_id: data.provider_id || null,
        user_id: data.user_uid || null, // Assuming user_uid might be null from the DB for walk-ins
        user_name: data.user_name,
        phone_number: data.phone_number,
        status: data.status,
        queue_type: data.queue_type,
        notes: data.notes || null,
        joined_at: data.created_at,
        served_at:data.served_at,
        position:data.position, // Use created_at from Supabase for joined_at
    };

    return { ...queueItem, position }; 

  } catch (error) {
    console.error('Error in createQueueEntry function:', error);
    throw error;
  }
};
  //featured services
  export const getFeaturedServices = async (): Promise<Service[]> => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
        company:companies ( name, id , slug),
        service_photos ( url ) 
        `)
        .eq('status', 'active')
        .eq('featureEnabled', true); // Assumes column name is `featureEnabled`
  
      if (error) {
        console.error("Error fetching featured services:", error);
        throw error;
      }
  
    // Normalize photo field
    const normalized = (data || []).map((svc: any) => ({
      ...svc,
      photo: svc.service_photos?.[0]?.url || svc.photo || null,
      service_photos: undefined,
    }));

    return normalized as Service[];
    } catch (error) {
      console.error("Error in getFeaturedServices function:", error);
      return [];
    }
  };


//services with category 
export const getCategoryWithServices = async (categoryId: string): Promise<CategoryWithServices | null> => {
  try {
    // First, get the category
    const { data: categoryData, error: categoryError } = await supabase
      .from('service_categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (categoryError) {
      if (categoryError.code === 'PGRST116') {
        console.log(`No category found with ID: ${categoryId}`);
        return null;
      }
      console.error("Supabase category query error:", categoryError);
      throw categoryError;
    }

    // Then, get the services for this category
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select(`
        *,
        company:companies ( name, id )
      `)
      .eq('category_id', categoryId)
      .eq('status', 'active');

    if (servicesError) {
      console.error("Supabase services query error:", servicesError);
      throw servicesError;
    }

    // Combine the data
    const result: CategoryWithServices = {
      ...categoryData,
      services: servicesData || []
    };
    
    return result;

  } catch (error) {
    console.error("Error fetching category with services:", error);
    return null;
  }
};



export const getCurrentQueueCount = async (serviceId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('queue_entries')
      .select('*', { count: 'exact', head: true })
      .eq('service_id', serviceId)
      .eq('status', 'waiting'); // Only count those who are actually waiting

    if (error) {
      console.error('Error getting queue count:', error);
      return 0;
    }
    return count || 0;
  } catch (error) {
    console.error('Error in getCurrentQueueCount function:', error);
    return 0;
  }
};


 
 // <--- CORRECTED BUCKET NAME

export async function getCompanyWithServices(companyId: string): Promise<Company | null> {
  const { data: companyData, error } = await supabase
    .from('companies')
    .select(`
      *,
      services (
        *,
        service_photos (
          url
        )
      )
    `)
    .eq('id', companyId)
    .single();

  if (error) {
    console.error("Error fetching company with services:", error.message);
    return null;
  }

  if (!companyData) {
    return null;
  }

  const servicesWithPhotoUrls = companyData.services?.map((service: any) => {
    let publicPhotoUrl = null;

    if (service.service_photos && service.service_photos.length > 0) {
      // Get the URL stored in the database
      const dbUrl = service.service_photos[0].url;

      // --- THIS IS THE FIX ---
      // Since the full URL is already in the database, we just use it directly.
      // We DO NOT call getPublicUrl() again.
      publicPhotoUrl = dbUrl;
    }

    return {
      ...service,
      photo: publicPhotoUrl,
      service_photos: undefined,
    };
  });

  return {
    ...companyData,
    services: servicesWithPhotoUrls,
  };
}

export async function getCompanyBySlugWithServices(companySlug: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      services (
        *,
        service_photos (
          url
        )
      )
    `)
    .eq('slug', companySlug) // The only change is here: 'slug' instead of 'id'
    .single();

  if (error) {
    console.error('Error fetching company by slug:', error);
    return null;
  }
  return data as Company;
}

export async function getCompanyLocationOptions(): Promise<LocationOption[]> {
  // Fetch all location_text values (potentially with duplicates)
  const { data, error } = await supabase
    .from('companies')
    .select('location_text') // Select only the location_text column
    .not('location_text', 'is', null) // Filter out null location_text values
    .not('location_text', 'eq', '');   // Filter out empty string location_text values

  if (error) {
    console.error("Error fetching company locations for options:", error.message);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Use a Set to collect unique location_text values
  const uniqueLocationTexts = new Set<string>();
  data.forEach((item: { location_text: string | null }) => {
    if (item.location_text && item.location_text.trim() !== '') {
      uniqueLocationTexts.add(item.location_text.trim());
    }
  });

  // Convert the Set of unique texts back to an array of LocationOption objects
  const locationOptions: LocationOption[] = Array.from(uniqueLocationTexts).map(text => ({
    id: text, // Using text as ID for simplicity
    value: text,
    label: text,
  }));

  return locationOptions;
}

export type NewQueueEntryData = Omit<QueueItem, 'id' | 'joined_at' | 'status' | 'position'> & {
  status?: QueueEntryStatus; // Make status optional for insert, default to 'waiting'
  position?: number | null;  // Make position optional and allow null.
                             // The DB often handles position with a default or trigger.
}

// in src/lib/supabase-utils.ts

// src/lib/supabase-utils.ts
// ... (imports)

export function getCompanyWorkingHours(
  company: Company,
  date: Date
): { start: Date; end: Date } | null {
  if (!company.working_hours) {
    return null;
  }
  
  // 1. Use the robust, already-fixed parser from booking-utils.ts
  const parsedWorkingHours = parseWorkingHours(company.working_hours);
  const dayOfWeek = getDay(date);

  // 2. Get the array of time ranges for today
  const dailyHoursRanges = parsedWorkingHours[dayOfWeek];

  // 3. Check if there are any hours defined for today
  if (!dailyHoursRanges || dailyHoursRanges.length === 0) {
    return null; // Company is closed on this day
  }

  // 4. For our purpose, we'll consider the first operational shift of the day.
  // The 'start' and 'end' properties here are already Date objects from the parser.
  const firstRange = dailyHoursRanges[0];

  // 5. Set the correct date component onto the parsed time components.
  const start = setMilliseconds(setSeconds(setMinutes(setHours(date, firstRange.start.getHours()), firstRange.start.getMinutes()), 0), 0);
  const end = setMilliseconds(setSeconds(setMinutes(setHours(date, firstRange.end.getHours()), firstRange.end.getMinutes()), 0), 0);
  
  return { start, end };
}

/**
 * Fetches all occupied slots for a given provider within a date range,
 * including both 'booking' and 'queue' reservations.
 */
export async function getProviderOccupiedSlots(
  providerId: string,
  startDate: Date,
  endDate: Date
): Promise<{ start_time: string; end_time: string }[]> {
  const { data, error } = await supabase
    .from('provider_reservations')
    .select('start_time, end_time')
    .eq('provider_id', providerId)
    .gte('start_time', startDate.toISOString())
    .lt('end_time', endDate.toISOString())
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching provider occupied slots:', error);
    throw error;
  }
  return data || [];
}
/**
 * Finds the latest end time for a provider's reservations today.
 * Accounts for current time and company working hours.
 */
export async function getLatestAvailableTimeForProvider(
  company: Company,
  providerId: string,
  serviceId: string
): Promise<Date | null> {
    const now = new Date();
    const { start: dayStart, end: dayEnd } = getDayRange(now);

    const occupiedSlots = await getProviderOccupiedSlots(providerId, dayStart, dayEnd);
    
    // Find the latest end time among all reservations today
    const latestReservationEnd = occupiedSlots.reduce((latest, slot) => {
        const slotEnd = new Date(slot.end_time);
        return isAfter(slotEnd, latest) ? slotEnd : latest;
    }, new Date(0)); // Start with a very early date

    // Determine the company's opening time for today
    const workingHours = getCompanyWorkingHours(company, now);
    if (!workingHours) {
        return null; // Company is closed
    }

    // The provider is available at the latest of:
    // 1. The current time ('now')
    // 2. The company's opening time today
    // 3. The end time of their last reservation
    const availableFrom = max([now, workingHours.start, latestReservationEnd]);
    
    return availableFrom;
}

export async function joinQueue(payload: CreateQueuePayload): Promise<AugmentedQueueItem> {
    const { service_id, provider_id, user_name, phone_number, notes, queue_type } = payload;

    if (!service_id || !provider_id || !user_name) {
      throw new Error("Missing required data to join queue (service, provider, or name).");
    }

    const service = await getServiceDetails(service_id);
    if (!service || !service.company || !service.estimated_wait_time_mins) {
      throw new Error("Service details, company, or estimated wait time not found.");
    }
    const company = service.company;
    const estimatedServiceDuration = service.estimated_wait_time_mins;

    let projectedStartTime: Date | null = null;
    let projectedEndTime: Date | null = null;

    try {
      const latestAvailable = await getLatestAvailableTimeForProvider(company, provider_id, service_id);
      const companyWorkingHours = getCompanyWorkingHours(company, latestAvailable || new Date());

      if (!companyWorkingHours || !latestAvailable) {
          throw new Error("Company is closed today or working hours are not defined.");
      }

      // --- START OF THE ROBUST FIX ---
      
      // 1. Start with the latest available time from the last reservation.
      let alignedPossibleStart = new Date(latestAvailable);
      
      // 2. Align this time to the next service interval boundary.
      //    For example, if duration is 30 mins and time is 16:01, it becomes 16:30.
      const minutesIntoInterval = alignedPossibleStart.getMinutes() % estimatedServiceDuration;
      if (minutesIntoInterval !== 0) {
          alignedPossibleStart = addMinutes(alignedPossibleStart, estimatedServiceDuration - minutesIntoInterval);
      }

      // 3. Clean the time by removing seconds and milliseconds.
      alignedPossibleStart = setMilliseconds(setSeconds(alignedPossibleStart, 0), 0);

      // 4. CRITICAL CHECK: If our aligned time is still at or before the last slot's end time,
      //    it means we have a "touching" conflict (e.g., last slot ended at 16:00, new one starts at 16:00).
      //    We must push it forward by one full service duration to prevent the overlap.
      if (alignedPossibleStart.getTime() <= latestAvailable.getTime()) {
          alignedPossibleStart = addMinutes(alignedPossibleStart, estimatedServiceDuration);
      }

      // --- END OF THE ROBUST FIX ---

      projectedStartTime = alignedPossibleStart;
      projectedEndTime = addMinutes(projectedStartTime, estimatedServiceDuration);

      if (isAfter(projectedEndTime, companyWorkingHours.end)) {
          throw new Error("Joining the queue now would mean service extends past closing hours. Please try again tomorrow or book an appointment.");
      }

    } catch (calcError: any) {
        console.error("Failed to calculate precise queue slot:", calcError.message);
        throw new Error(`Failed to determine an available queue slot: ${calcError.message}`);
    }

    const currentQueueCount = await getCurrentQueueCount(service_id);
    const estimatedPosition = currentQueueCount + 1;
    let createdQueueEntryResult: QueueItem | null = null;

    try {
        // Insert into queue_entries
        const { data: queueResult, error: queueError } = await supabase.from('queue_entries').insert({
            service_id, provider_id, user_name, phone_number, queue_type, status: 'waiting', notes,
            projected_start_time: projectedStartTime!.toISOString(),
            projected_end_time: projectedEndTime!.toISOString(),
            position: estimatedPosition,
        }).select().single();

        if (queueError || !queueResult) throw new Error(`Failed to join queue: ${queueError?.message || 'Unknown DB error'}`);
        createdQueueEntryResult = queueResult as QueueItem;
        
        // Insert into provider_reservations
        const { error: reservationError } = await supabase.from('provider_reservations').insert({
            provider_id, service_id,
            start_time: projectedStartTime!.toISOString(),
            end_time: projectedEndTime!.toISOString(),
            source_type: 'queue',
            source_row_id: createdQueueEntryResult.id,
        });

        if (reservationError) throw new Error(`Failed to create provider reservation for queue: ${reservationError.message}`);
        
        return { ...createdQueueEntryResult, position: estimatedPosition, estimatedServiceStartTime: projectedStartTime, estimatedServiceEndTime: projectedEndTime };

    } catch (error: any) {
        if (createdQueueEntryResult?.id) {
            console.warn(`Attempting to delete partially created queue entry ${createdQueueEntryResult.id} due to a subsequent error.`);
            await supabase.from('queue_entries').delete().eq('id', createdQueueEntryResult.id);
        }
        console.error('Transaction failed for queue entry:', error);
        throw error;
    }
}


export async function createBooking(
  bookingData: Omit<Booking, 'id' | 'created_at' | 'status'> & { status?: BookingStatus }
): Promise<Booking> {
  const { provider_id, service_id, start_time, end_time, user_id } = bookingData;

  if (!provider_id || !service_id || !start_time || !end_time) {
      throw new Error("Missing required booking data for reservation.");
  }

  const bookingStartTime = new Date(start_time);
  const bookingEndTime = new Date(end_time);

  // Check for overlaps using provider_reservations (our single source of truth)
  const existingReservations = await getProviderOccupiedSlots(
      provider_id,
      startOfDay(bookingStartTime),
      endOfDay(bookingEndTime)
  );

  const newBookingRange = { start: bookingStartTime, end: bookingEndTime };

  const hasOverlap = existingReservations.some(reservation => {
      const existingStart = new Date(reservation.start_time);
      const existingEnd = new Date(reservation.end_time);
      return (newBookingRange.start < existingEnd) && (newBookingRange.end > existingStart);
  });

  if (hasOverlap) {
      throw new Error("The selected time slot is no longer available. Please choose another time.");
  }

  let createdBooking: Booking | null = null;
  try {
      const { data: bookingResult, error: bookingError } = await supabase
          .from('bookings')
          .insert({
              ...bookingData,
              status: bookingData.status || 'pending',
          })
          .select()
          .single();

      if (bookingError || !bookingResult) {
          console.error('Supabase booking insert error:', bookingError);
          throw new Error(`Failed to create booking: ${bookingError?.message || 'Unknown error'}`);
      }
      createdBooking = bookingResult;

      const { data: reservationResult, error: reservationError } = await supabase
          .from('provider_reservations')
          .insert({
              provider_id: provider_id,
             // Ensure user_id can be null
              service_id: service_id,
              start_time: start_time,
              end_time: end_time,
              source_type: 'booking',
              source_row_id: createdBooking?.id,
          })
          .select()
          .single();

      if (reservationError || !reservationResult) {
          console.error('Supabase reservation insert error:', reservationError);
          throw new Error(`Failed to create provider reservation: ${reservationError?.message || 'Unknown error'}`);
      }
      if (!createdBooking) {
        throw new Error('Booking creation failed: result is null.');
      }
      return createdBooking;

  } catch (error: any) {
      if (createdBooking?.id) {
          console.warn(`Attempting to delete partially created booking ${createdBooking.id} due to reservation failure.`);
          await supabase.from('bookings').delete().eq('id', createdBooking.id);
      }
      console.error('Transaction failed for booking:', error);
      throw error;
  }
}

export async function getConfirmedBookingsForProvider(
  providerId: string,
  startDate: Date,
  endDate: Date
): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('provider_id', providerId)
    .eq('status', 'confirmed') // Only confirmed bookings block slots
    .gte('start_time', startDate.toISOString())
    .lt('end_time', endDate.toISOString())
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching confirmed bookings:', error);
    throw error;
  }
  return data || [];
}

export async function getBookingDetails(bookingId: string): Promise<Booking | null> {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            *,
            service:services(*),
            company:companies(*),
            provider:providers(*)
        `)
        .eq('id', bookingId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error fetching booking details:', error.message);
        throw new Error('Failed to fetch booking details.');
    }

    return data;
}
export async function getQueueEntryDetails(queueId: string): Promise<QueueItem | null> {
    const { data, error } = await supabase
        .from('queue_entries') // Assuming your table name is 'queue_entries'
        .select(`
            *,
            service:services(*),
            company:companies(*),
            provider:providers(*)
        `)
        .eq('id', queueId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error fetching queue entry details:', error.message);
        throw new Error('Failed to fetch queue entry details.');
    }

    return data;
}

export async function getActiveQueueEntriesForProvider(serviceId: string, providerId: string): Promise<QueueItem[]> {
  const { data, error } = await supabase
    .from('queue_entries')
    .select('*')
    .eq('service_id', serviceId)
    .eq('provider_id', providerId)
    .in('status', ['waiting', 'serving'])
    .order('joined_at', { ascending: true });

  if (error) {
    console.error('Error fetching active queue entries:', error);
    throw error;
  }
  return data || [];
}


// This is the function your public page at app/company/[slug]/page.tsx will use
// export const getCompanyBySlug = async (slug: string): Promise<Company | null> => {
//   try {
//     const { data, error } = await supabase
//       .from('companies')
//       .select(`
//         *,
//         services (
//           *,
//           service_photos ( url )
//         )
//       `)
//       .eq('slug', slug) // <-- The key change: query by slug
//       .single();

//     if (error) throw error;
//     if (!data) return null;

//     // Process photo URLs for services (like we did before)
//     const processedServices = data.services?.map((service: any) => {
//       const photoUrl = service.service_photos?.[0]?.url || null;
//       return { ...service, photo: photoUrl };
//     });

//     return { ...data, services: processedServices } as Company;

//   } catch (error) {
//     console.error('Error fetching company by slug:', error);
//     return null;
//   }
// };

// lib/utils.ts
export function generateSlug(name: string): string {
  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
  const p = new RegExp(a.split('').join('|'), 'g')

  return name.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

export async function getRecentCompanies(limit: number = 8): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, logo, location_text, created_at') // Select only necessary fields for display
    .order('created_at', { ascending: false }) // Order by creation date, newest first
    .limit(limit); // Limit the number of companies returned

  if (error) {
    console.error('Error fetching recent companies:', error);
    return [];
  }
  return data as Company[];
}

export const getFilteredServices = async (
  filters: FilterState
): Promise<Service[]> => {
  try {
    let query = supabase
      .from('services')
      .select(`
        *,
        company:companies (
          *,
          company_types (*) 
        ),
        category:service_categories (*),
        service_photos ( url )  // <-- THIS IS THE CRUCIAL FIX FOR PHOTOS
      `)
      .eq('status', 'active');

    // Apply category filter
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    // Apply company filter
    if (filters.companyIds && filters.companyIds.length > 0) {
      query = query.in('company_id', filters.companyIds);
    }

    // Execute query to get initial data, then apply client-side filters
    const { data, error } = await query;

    if (error) {
      console.error('Error getting filtered services from Supabase:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    // Map raw data to Service type with nested company/category
    let services: Service[] = data.map((item: any) => mapToService(item));

    // Client-side filtering for company types
    if (filters.companyTypeIds && filters.companyTypeIds.length > 0) {
      services = services.filter(service => {
        const companyTypes = (service.company as any)?.company_company_types || [];
        return companyTypes.some((ct: any) => 
          filters.companyTypeIds.includes(ct.company_type_id)
        );
      });
    }

    // Client-side filtering for location (since server-side filtering on joined text is complex)
    if (filters.locations && filters.locations.length > 0) {
        const locationKeywords = filters.locations.map(loc => loc.value.toLowerCase()); // e.g., "New York, NY"
        services = services.filter(service => {
            const companyLocationText = service.company?.location_text?.toLowerCase();
            const companyAddress = service.company?.address?.toLowerCase();
            return locationKeywords.some(keyword =>
                (companyLocationText && companyLocationText.includes(keyword)) ||
                (companyAddress && companyAddress.includes(keyword))
            );
        });
    }

    // Client-side filtering for searchTerm (to include company.name and description)
    if (filters.searchTerm) {
        const q = filters.searchTerm.trim().toLowerCase();
        if (q.length > 0) {
            const tokens = q.split(/\s+/).filter(Boolean);
            services = services.filter(service => {
                const companyName = service.company?.name?.toLowerCase();
                return tokens.some(token =>
                    (service.name && service.name.toLowerCase().includes(token)) ||
                    (service.code && service.code.toLowerCase().includes(token)) ||
                    (service.description && service.description.toLowerCase().includes(token)) ||
                    (companyName && companyName.includes(token))
                );
            });
        }
    }

    return services;

  } catch (error) {
    console.error('Error in getFilteredServices function:', error);
    return [];
  }
};

export async function getCompanyDetailsById(companyId: string): Promise<Company | null> {
  // IMPORTANT: For this query to work, you must have a 'services' table
  // with a 'company_id' column that is a foreign key to 'companies.id'.
  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      services (
        *,
        service_photos ( url )
      )
    `)
    .eq('id', companyId)
    .single(); // .single() is perfect for fetching one specific item

  if (error) {
    console.error(`Error fetching details for company ${companyId}:`, error);
    // This will help you debug if the relationship is wrong
    if (error.code === 'PGRST200') {
        console.error("Hint: The error 'PGRST200' (406 Not Acceptable) often means the relationship between 'companies' and 'services' is not correctly defined in the database.");
    }
    return null;
  }

  return data;
}
export async function getCompanyTypeById(typeId: string): Promise<CompanyType | null> {
  const { data, error } = await supabase
    .from('company_types')
    .select('*')
    .eq('id', typeId)
    .single(); // .single() expects exactly one row, which is perfect here

  if (error) {
    console.error(`Error fetching company type ${typeId}:`, error);
    return null;
  }

  return data;
}
export async function getCompaniesByType(typeId: string): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    // The query syntax '*, company_company_types!inner(*)' tells Supabase:
    // 1. Select all columns from the 'companies' table (*).
    // 2. Do an INNER JOIN on 'company_company_types'. !inner ensures we only get
    //    companies that actually have a type assigned.
    .select('*, company_company_types!inner(company_type_id)')
    // 3. Filter the joined table to only include rows where the type ID matches.
    .eq('company_company_types.company_type_id', typeId);

  if (error) {
    console.error(`Error fetching companies for type ${typeId}:`, error);
    return [];
  }

  return data || [];
}
export async function getCompanyTypesWithCounts(): Promise<CompanyTypeWithCount[]> {
  // We use .rpc() to call the PostgreSQL function we created
  const { data, error } = await supabase.rpc('get_company_types_with_company_counts');

  if (error) {
    console.error("Error fetching company types with counts:", error);
    return []; // Return an empty array on failure
  }

  // The 'data' will be an array of objects matching our CompanyTypeWithCount type
  return data || [];
}


//fix the issue overla the join queue and other