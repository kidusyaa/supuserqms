// Supabase utilities - Complete replacement for firebase-utils.ts
import { supabase } from './supabaseClient';
import type { 
  Company, 
  Service, 
  QueueItem, 
  User, 
  Category, 
  Provider, 
  Booking,
  BookingStatus, 
  QueueEntryStatus,
  MessageTemplate, 
  Location,
  LocationOption,
  GlobalStatsData,
  FilterState
} from '../type';


export type CategoryWithServices = Category & {
  services: Service[];
};

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
      .from('global_categories')
      .select('*');

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

export const getCategoryById = async (id: string): Promise<Category | null> => {
  try {
    const { data, error } = await supabase
      .from('global_categories')
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
          )
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
        
        // We can delete the temporary join table data if we want a clean object
        delete service.service_providers;
  
        return {
          ...service,
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
      .from('global_categories')
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
    const { data, error } = await supabase
      .from('companies')
      .select('*');

    if (error) {
      console.error('Error getting all companies:', error?.message);
      return [];
    }

    return (data || []).map((company: any) => mapToCompany(company));
  } catch (error) {
    console.error('Error getting all companies:', error);
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
          company:companies ( name, id ) 
        `)
        .eq('status', 'active')
        .eq('featureEnabled', true); // Assumes column name is `featureEnabled`
  
      if (error) {
        console.error("Error fetching featured services:", error);
        throw error;
      }
  
      return data || [];
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
      .from('global_categories')
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


export type NewQueueEntryData = Omit<QueueItem, 'id' | 'joined_at' | 'status' | 'position'> & {
  status?: QueueEntryStatus; // Make status optional for insert, default to 'waiting'
  position?: number | null;  // Make position optional and allow null.
                             // The DB often handles position with a default or trigger.
}

export async function joinQueue(
  queueEntryData: NewQueueEntryData // Use the new, explicit type here
): Promise<QueueItem> {
  const { data, error } = await supabase
    .from('queue_entries')
    .insert({
      ...queueEntryData,
      status: queueEntryData.status || 'waiting', // Default status if not provided
      // No need to explicitly set position here if DB handles it,
      // or set to null if DB expects it and allows null.
      // If position is NOT set by DB, you might calculate it here:
      // position: queueEntryData.position ?? null, // Default to null if undefined
    })
    .select()
    .single();

  if (error) {
    console.error('Error joining queue:', error);
    throw error;
  }
  return data;
}

export async function createBooking(
  // Update Omit to reflect the new field names in Booking.
  // We're omitting 'id', 'created_at', and 'status' (as status can be overridden).
  // The rest of the properties in Booking are expected directly.
  bookingData: Omit<Booking, 'id' | 'created_at' | 'status'> & { status?: BookingStatus }
): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      ...bookingData,
      status: bookingData.status || 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
  return data;
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
export const getCompanyBySlug = async (slug: string): Promise<Company | null> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select(`
        *,
        services (
          *,
          service_photos ( url )
        )
      `)
      .eq('slug', slug) // <-- The key change: query by slug
      .single();

    if (error) throw error;
    if (!data) return null;

    // Process photo URLs for services (like we did before)
    const processedServices = data.services?.map((service: any) => {
      const photoUrl = service.service_photos?.[0]?.url || null;
      return { ...service, photo: photoUrl };
    });

    return { ...data, services: processedServices } as Company;

  } catch (error) {
    console.error('Error fetching company by slug:', error);
    return null;
  }
};

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
          id,
          name,
          location_text,
          address // Assuming address might contain location info
        ),
        category:global_categories (
          id,
          name
        )
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
