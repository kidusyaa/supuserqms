// Supabase utilities - Complete replacement for firebase-utils.ts
import { supabase } from './supabaseClient';
import type { 
  Company, 
  Service, 
  QueueItem, 
  User, 
  Category, 
  Provider, 
  MessageTemplate, 
  Location,
  LocationOption,
  GlobalStatsData
} from '../type';


export type CategoryWithServices = Category & {
  services: Service[];
};

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
      console.error('Error getting service with providers:', error);
      return null;
    }

    if (!service) return null;

    // Transform the data to match our Service type
    const providers = service.service_providers
      ? service.service_providers
          .map((sp: any) => sp.providers)
          .filter(Boolean) as Provider[]
      : [];

    return {
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
      providers
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
      console.error('Error getting all companies:', error);
      return [];
    }

    return (data || []).map((company: any) => ({
      ...company,
      workingHours: company.working_hours
    })) as Company[];
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
        company:companies ( * ),
        service_providers (
          providers ( * )
        )
      `) // --- THE FIX: The comment has been removed from the query string ---
      .eq('id', serviceId)
      .single(); 

    if (error) {
      // This part is important for debugging future query errors
      if (error.code === 'PGRST116') {
        console.log(`No service found with ID: ${serviceId}`);
        return null;
      }
      // Log the full error to see what Supabase is complaining about
      console.error("Supabase query error in getServiceDetails:", error); 
      throw error;
    }
    
    if (!data) {
      return null;
    }

    const service = data as any; 

    const providers = service.service_providers
      ? service.service_providers.map((sp: any) => sp.providers).filter(Boolean)
      : [];

    delete service.service_providers;

    return {
      ...service,
      providers: providers,
    } as Service;

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
  
  
  // The main function to create a new queue entry
  export type CreateQueuePayload = {
    service_id: string;
    provider_id: string;
    user_name: string;
    phone_number: string;
    queue_type:"walk-in" | "booking";
    notes?: string;
    // No user_uid needed here for guest checkout
  }
  
// In your Supabase utility file (e.g., src/lib/supabase-utils.ts)

// In your Supabase utility file (e.g., src/lib/supabase-utils.ts)

export const createQueueEntry = async (queueData: CreateQueuePayload): Promise<QueueItem> => {
  try {
    let finalProviderId: string | null = queueData.provider_id;

    if (finalProviderId === 'any') {
      const { data: bestProviderId, error: rpcError } = await supabase
        .rpc('find_least_busy_provider', { service_id_param: queueData.service_id });
      
      if (rpcError || !bestProviderId) {
        console.error("Could not find an available provider, falling back to unassigned:", rpcError);
        finalProviderId = null; 
      } else {
        finalProviderId = bestProviderId;
      }
    }
    
    let position = 1; // Default position for non-walk-ins
    if (queueData.queue_type === 'walk-in') {
        const { count, error: countError } = await supabase
          .from('queue_entries')
          .select('*', { count: 'exact', head: true })
          .eq('service_id', queueData.service_id)
          .eq('status', 'waiting');
        if (countError) throw countError;
        position = (count ?? 0) + 1;
    }

    // --- THE FIX: REMOVED the incorrect 'created_at' and 'status' properties ---
    // The database will automatically set these with its DEFAULT values.
    const entryToInsert = {
      service_id: queueData.service_id,
      provider_id: finalProviderId,
      user_name: queueData.user_name,
      phone_number: queueData.phone_number,
      position: position,
      queue_type: queueData.queue_type,
      notes: queueData.notes,
      user_uid: null,
      // No `status` needed - defaults to 'waiting'
      // No `joined_at` needed - defaults to now()
    };

    const { data: newEntry, error } = await supabase
      .from('queue_entries')
      .insert(entryToInsert)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error); 
      throw error;
    }
    
    // --- THE FIX: REMOVED the stray line of code that was causing a syntax error ---
    return newEntry as QueueItem;

  } catch (error) {
    console.error('Error in createQueueEntry function:', error);
    throw new Error('Failed to join the queue.');
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
 
//--search from all---
// export const searchServices = async (searchTerm: string): Promise<Service[]> => {
//   const trimmedTerm = searchTerm.trim();
//   // Don't search if the query is too short
//   if (trimmedTerm.length < 2) {
//     return [];
//   }

//   // Prepare the search term for a "contains" query (case-insensitive)
//   const formattedTerm = `%${trimmedTerm}%`;

//   try {
//     const { data, error } = await supabase
//       .from('services')
//       .select(`
//         id,
//         name,
//         code,
//         company_id,
//         company:companies ( name )
//       `)
//       .eq('status', 'active') // Only search for active services
//       .or(
//         `name.ilike.${formattedTerm},` +          // Search in service name
//         `code.ilike.${formattedTerm},` +          // Search in service code
//         `companies.name.ilike.${formattedTerm}`   // Search in the joined company name
//       )
//       .limit(8); // Limit the number of results to keep the dropdown clean

//     if (error) {
//       console.error("Error searching services:", error);
//       throw error;
//     }

//     return data || [];
//   } catch (error) {
//     console.error("Error in searchServices function:", error);
//     return [];
//   }
// };