// src/lib/api.ts

import { supabase } from './supabaseClient';
import type { Company, Category, Location, Provider, Service } from '../type'; // Assuming you have these types

// --- 1. Get Locations (Replaces getLocations from firebase-utils) ---
export const getLocations = async (): Promise<Location[]> => {
  const { data, error } = await supabase
    .from('global_locations') // The name of your locations table
    .select('*');

  if (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
  return data || [];
};

// --- 2. Get Categories (Replaces getCategories from firebase-utils) ---
export const getCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('global_categories') // The name of your categories table
    .select('*');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data || [];
};

// --- 3. Create Company (Replaces createCompany from firebase-utils) ---
// Note the changes: We no longer handle the password here!
export const createCompany = async (companyData: Omit<Company, 'id' | 'password'>): Promise<Company> => {
  try {
    // The insert method takes an object that matches your table columns.
    // The database will automatically generate the 'id'.
    const { data: newCompany, error } = await supabase
      .from('companies')
      .insert([companyData]) // Supabase expects an array of objects
      .select()             // .select() returns the newly created row
      .single();            // .single() converts the returned array of 1 item into a single object

    if (error) {
      // This will catch database-level errors, like a duplicate email.
      console.error('Error creating company in Supabase:', error);
      throw error;
    }

    if (!newCompany) {
      throw new Error("Company creation returned no data.");
    }
    
    return newCompany;

  } catch (error) {
    console.error('Error in createCompany function:', error);
    throw new Error('Failed to create company');
  }
};
export const createService = async (serviceData: Omit<Service, 'id' | 'createdAt' | 'providers'>): Promise<Service> => {
  try {
    const { data: newService, error } = await supabase
      .from('services')
      .insert([serviceData])
      .select()
      .single();

    if (error) {
      console.error('Error creating service in Supabase:', error);
      throw error;
    }
    return newService;
  } catch (error) {
    throw new Error('Failed to create service');
  }
};
export const createProviders = async (providersData: Omit<Provider, 'id' | 'createdAt'>[]): Promise<Provider[]> => {
  try {
    // We can insert an array of objects in a single API call!
    const { data: newProviders, error } = await supabase
      .from('providers')
      .insert(providersData)
      .select();

    if (error) {
      console.error('Error creating providers in Supabase:', error);
      throw error;
    }
    return newProviders || [];
  } catch (error) {
    throw new Error('Failed to create providers');
  }
};
export const linkProvidersToService = async (serviceId: string, providerIds: string[]): Promise<void> => {
  try {
    // We create an array of objects to insert into our join table.
    const linksToCreate = providerIds.map(providerId => ({
      service_id: serviceId,
      provider_id: providerId
    }));

    const { error } = await supabase
      .from('service_providers')
      .insert(linksToCreate);

    if (error) {
      console.error('Error linking providers to service:', error);
      throw error;
    }
    
    console.log(`✅ Successfully linked ${providerIds.length} providers to service ${serviceId}`);

  } catch (error) {
    throw new Error('Failed to link providers to service');
  }
};
export const getCompanyAndAllData = async (ownerId: string): Promise<Company | null> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select(`
        *,
        services (
          *,
          queue_entries ( * ),
          service_providers (
            providers ( * )
          )
        ),
        providers ( * )
      `)
      .eq('owner_uid', ownerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('No company found for this owner.');
        return null;
      }
      throw error;
    }

    if (!data) {
      return null;
    }

    if (data.services) {
      // --- START OF THE FIX ---
      // We are explicitly telling TypeScript the shape of the 'service' object
      // as it comes from Supabase, BEFORE we transform it.
      data.services = data.services.map((
        service: Service & { service_providers: { providers: Provider | null }[] }
      ) => {
        // Now TypeScript knows that `service.service_providers` exists and what it contains.
        const providers = service.service_providers
          ? service.service_providers
              // We also add a type here for 'sp' for full type safety
              .map((sp: { providers: Provider | null }) => sp.providers)
              // .filter(Boolean) will remove any null providers
              .filter(Boolean) as Provider[]
          : [];

        return {
          ...service,
          providers: providers,
        };
      });
      // --- END OF THE FIX ---
    }
    
    return data as Company;
    
  } catch (error) {
    console.error('Error fetching company and all its data:', error);
    return null;
  }
};
export const unlinkProviderFromService = async (serviceId: string, providerId: string): Promise<void> => {
  const { error } = await supabase
    .from('service_providers')
    .delete()
    .eq('service_id', serviceId)
    .eq('provider_id', providerId);

  if (error) {
    console.error("Error unlinking provider:", error);
    throw error;
  }
};

// --- NEW: Update a Provider's details ---
export const updateProvider = async (providerId: string, updates: Partial<Provider>): Promise<Provider> => {
  const { data, error } = await supabase
    .from('providers')
    .update(updates)
    .eq('id', providerId)
    .select()
    .single();

  if (error) {
    console.error("Error updating provider:", error);
    throw error;
  }
  return data;
};

// --- Update Service ---
export const updateService = async (serviceId: string, updates: Partial<Service>): Promise<Service> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', serviceId)
      .select()
      .single();

    if (error) {
      console.error('Error updating service:', error);
      throw error;
    }
    return data;
  } catch (error) {
    throw new Error('Failed to update service');
  }
};

// --- Delete Service ---
export const deleteService = async (serviceId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId);

    if (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  } catch (error) {
    throw new Error('Failed to delete service');
  }
};

// --- Get Services by Category ---
export const getServicesByCategory = async (categoryId: string): Promise<Service[]> => {
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

// --- Get All Services ---
export const getAllServices = async (): Promise<Service[]> => {
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
      .eq('status', 'active');

    if (error) {
      console.error('Error getting all services:', error);
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
    console.error('Error getting all services:', error);
    return [];
  }
};

// --- Get Categories with Service Counts ---
export const getCategoriesWithServiceCounts = async (): Promise<Category[]> => {
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