// Firebase utilities with proper error handling
import type { Company, Service, QueueItem, CreateQueueItem, User, Category, Provider, MessageTemplate, LocationOption,GlobalStatsData, Location } from '../type';

// Import Firebase modules directly - this should work now with the updated config
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  collectionGroup,
  getCountFromServer,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase-simple';
// ✅ correct

export const getLocations = async (): Promise<Location[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'location'));
    // We combine 'place' and 'city' for the display name
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Location));
  } catch (error) {
    console.error('Error getting location:', error);
    return [];
  }
};


// ... keep all existing imports and functions
export const getAllCategories = async (): Promise<Category[]> => {
  const categoriesCol = collection(db, "categories");
  const q = query(categoriesCol);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
};

export const getCategoryById = async (id: string): Promise<Category | null> => {
  try {
    const docRef = doc(db, 'categories', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Category) : null;
  } catch (error) {
    console.error('Error getting category by ID:', error);
    return null;
  }
};
// ✅ NEW FUNCTION: Get a single service with its providers
export const getServiceWithProviders = async (
  companyId: string, 
  serviceId: string
): Promise<Service | null> => {
  console.log(`[Firebase] Attempting to fetch service: companies/${companyId}/services/${serviceId}`);
  
  try {
    const serviceDocRef = doc(db, 'companies', companyId, 'services', serviceId);
    const serviceSnap = await getDoc(serviceDocRef);

    if (!serviceSnap.exists()) {
      console.error("[Firebase] Service document does not exist at the specified path.");
      return null;
    }
    console.log("[Firebase] Service document found successfully.");

    const serviceData = { id: serviceSnap.id, ...serviceSnap.data() } as Service;
    // If service is inactive, block downstream use
    if (serviceData.status !== 'active') {
      return null;
    }

    console.log("[Firebase] Now fetching providers subcollection...");
    // We wrap this in its own try/catch in case only this part fails (e.g., security rules)
    try {
        const providers = await getProvidersByService(companyId, serviceId);
        console.log("[Firebase] Fetched providers:", providers);
        serviceData.providers = providers;
    } catch (providerError) {
        console.error("[Firebase] Failed to fetch providers subcollection:", providerError);
        // Decide if you still want to return the service without providers
        // For now, we'll assume providers are essential and bubble up the error.
        throw new Error("Could not fetch service providers. Check subcollection permissions.");
    }

    return serviceData;
  } catch (error) {
    console.error('[Firebase] Critical error in getServiceWithProviders:', error);
    // Re-throwing the error allows the calling component's catch block to handle it.
    throw error;
  }
};
// ✅ NEW FUNCTION 1: Get Categories with Dynamic Service Counts
// ✅ NEW FUNCTION 1: Get ALL services from ALL companies
export const getAllServices = async (): Promise<Service[]> => {
  try {
    // This query gets all ACTIVE documents from any subcollection named "services"
    const servicesQuery = query(
      collectionGroup(db, 'services'),
      where('status', '==', 'active')
    );
    const servicesSnapshot = await getDocs(servicesQuery);
    const services = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));

    // OPTIONAL BUT HIGHLY RECOMMENDED: Attach company data to each service
    if (services.length > 0) {
      // 1. Get all companies in one go (very efficient)
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      const companiesMap = new Map(
        companiesSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() } as Company])
      );
      
      // 2. Map company data to each service
      return services.map(service => ({
        ...service,
        company: companiesMap.get(service.companyId),
      }));
    }

    return services;
  } catch (error) {
    console.error("Error getting all services:", error);
    // Fallback: iterate companies and read subcollections to avoid collection group index requirement
    try {
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      const companiesMap = new Map(
        companiesSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() } as Company])
      );
      const services: Service[] = [];
      for (const companyDoc of companiesSnapshot.docs) {
        const activeServicesSnap = await getDocs(
          query(collection(db, 'companies', companyDoc.id, 'services'), where('status', '==', 'active'))
        );
        for (const svcDoc of activeServicesSnap.docs) {
          const data = svcDoc.data() as any;
          services.push({ id: svcDoc.id, ...data, company: companiesMap.get(data.companyId) } as Service);
        }
      }
      return services;
    } catch (fallbackError) {
      console.error('Fallback getAllServices failed:', fallbackError);
      return [];
    }
  }
};

// ✅ NEW FUNCTION 2: Get ALL services for a specific category from ALL companies
export const getAllServicesByCategory = async (categoryId: string): Promise<Service[]> => {
  try {
    // Query the "services" collection group with a "where" clause
    const servicesQuery = query(
      collectionGroup(db, 'services'),
      where("categoryId", "==", categoryId),
      where('status', '==', 'active')
    );
    const servicesSnapshot = await getDocs(servicesQuery);
    const services = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));

    // Also attach company data here for a better user experience
    if (services.length > 0) {
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      const companiesMap = new Map(
        companiesSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() } as Company])
      );
      return services.map(service => ({
        ...service,
        company: companiesMap.get(service.companyId),
      }));
    }

    return services;
  } catch (error) {
    console.error(`Error getting all services for category ${categoryId}:`, error);
    // Fallback: read per-company services, filter to active, then filter category in memory (avoids composite index)
    try {
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      const companiesMap = new Map(
        companiesSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() } as Company])
      );
      const services: Service[] = [];
      for (const companyDoc of companiesSnapshot.docs) {
        const activeServicesSnap = await getDocs(
          query(collection(db, 'companies', companyDoc.id, 'services'), where('status', '==', 'active'))
        );
        for (const svcDoc of activeServicesSnap.docs) {
          const data = svcDoc.data() as any;
          if (data.categoryId === categoryId) {
            services.push({ id: svcDoc.id, ...data, company: companiesMap.get(data.companyId) } as Service);
          }
        }
      }
      return services;
    } catch (fallbackError) {
      console.error('Fallback getAllServicesByCategory failed:', fallbackError);
      return [];
    }
  }
};

// ✅ NEW FUNCTION 3: Get categories with service counts from ALL companies
export const getGlobalCategoriesWithServiceCounts = async (): Promise<Category[]> => {
  try {
    // 1) Fetch all categories from Firestore
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    const categoriesRaw = categoriesSnapshot.docs.map((docSnap: any) => ({ id: docSnap.id, ...docSnap.data() }));

    // 2) Fetch all services globally and count by categoryId
    const allServices = await getAllServices();
    const serviceCounts = new Map<string, number>();
    for (const service of allServices) {
      if (service.categoryId) {
        const currentCount = serviceCounts.get(service.categoryId) || 0;
        serviceCounts.set(service.categoryId, currentCount + 1);
      }
    }

    // 3) Return categories with a computed `services` count and safe fallbacks for optional fields
    const categoriesWithCounts: Category[] = categoriesRaw.map((category: any) => ({
      id: category.id,
      name: category.name ?? 'Unnamed',
      description: category.description ?? '',
      icon: category.icon ?? '📦',
      image: category.image ?? '/images/images.jpeg',
      gradient: category.gradient ?? 'from-slate-600 to-gray-700',
      services: serviceCounts.get(category.id) || 0,
      avgWait: category.avgWait ?? '0 min',
      popular: category.popular ?? false,
      trending: category.trending ?? false,
    }));

    return categoriesWithCounts;
  } catch (error) {
    console.error('Error getting global categories with service counts:', error);
    return [];
  }
};
// export const getCategories = async (): Promise<Category[]> => {
//   try {
//     const snapshot = await getDocs(collection(db, 'categories'));
//     return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Category));
//   } catch (error) {
//     console.error('Error getting categories:', error);
//     return [];
//   }
// };

// export const getCategoryById = async (id: string): Promise<Category | null> => {
//   try {
//     const docRef = doc(db, 'categories', id);
//     const docSnap = await getDoc(docRef);
//     return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Category : null;
//   } catch (error) {
//     console.error('Error getting category by ID:', error);
//     return null;
//   }
// };

// Companies
export const createCompany = async (companyData: Omit<Company, 'id'>): Promise<string> => {
  try {
    const companyId = `company-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await setDoc(doc(db, 'companies', companyId), {
      ...companyData,
      createdAt: serverTimestamp()
    });
    return companyId;
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
};

export const getCompanyById = async (id: string): Promise<Company | null> => {
  try {
    const docRef = doc(db, 'companies', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Company : null;
  } catch (error) {
    console.error('Error getting company by ID:', error);
    return null;
  }
};

export const getCompanyByEmail = async (email: string): Promise<Company[]> => {
  try {
    const companiesRef = collection(db, 'companies');
    const q = query(companiesRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Company));
  } catch (error) {
    console.error('Error getting company by email:', error);
    return [];
  }
};

export const updateCompany = async (id: string, updates: Partial<Company>): Promise<void> => {
  try {
    const docRef = doc(db, 'companies', id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
};

export const getAllCompanies = async (): Promise<Company[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'companies'));
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Company));
  } catch (error) {
    console.error('Error getting all companies:', error);
    return [];
  }
};

// --- NEW FUNCTION 2: Get and format companies for the filter UI ---
export const getCompanyOptions = async (): Promise<LocationOption[]> => {
  try {
    const companies = await getAllCompanies();
    // Transform the data to the { id, value, label } shape
    return companies.map((company) => ({
      id: company.id,
      value: company.id,    // The unique ID for filtering
      label: company.name,  // The display name for the user
    }));
  } catch (error) {
    console.error("Error getting formatted company options:", error);
    return [];
  }
};



// Services
export const createService = async (companyId: string, serviceData: Omit<Service, 'id' | 'companyId'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'companies', companyId, 'services'), {
      ...serviceData,
      companyId,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating service:', error);
    throw error;
  }
};

export const getServicesByCompany = async (companyId: string): Promise<Service[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'companies', companyId, 'services'));
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Service));
  } catch (error) {
    console.error('Error getting services by company:', error);
    return [];
  }
};

export const getServiceById = async (companyId: string, serviceId: string): Promise<Service | null> => {
  try {
    const docRef = doc(db, 'companies', companyId, 'services', serviceId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Service : null;
  } catch (error) {
    console.error('Error getting service by ID:', error);
    return null;
  }
};

export const updateService = async (companyId: string, serviceId: string, updates: Partial<Service>): Promise<void> => {
  try {
    const docRef = doc(db, 'companies', companyId, 'services', serviceId);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

export const deleteService = async (companyId: string, serviceId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'companies', companyId, 'services', serviceId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
};

// Providers
const getProvidersCollectionRef = (companyId: string, serviceId: string) => {
  return collection(db, 'companies', companyId, 'services', serviceId, 'providers');
};

// GET all providers for a specific service
export const getProvidersByService = async (companyId: string, serviceId: string): Promise<Provider[]> => {
  const providersCollectionRef = getProvidersCollectionRef(companyId, serviceId);
  const snapshot = await getDocs(providersCollectionRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Provider));
};

// CREATE a new provider for a service
export const createProviderForService = async (companyId: string, serviceId: string, providerData: Omit<Provider, 'id'>): Promise<string> => {
  const providersCollectionRef = getProvidersCollectionRef(companyId, serviceId);
  const docRef = await addDoc(providersCollectionRef, providerData);
  return docRef.id;
};

// UPDATE an existing provider
export const updateProviderForService = async (companyId: string, serviceId: string, providerId: string, updates: Partial<Provider>): Promise<void> => {
  const providerDocRef = doc(db, 'companies', companyId, 'services', serviceId, 'providers', providerId);
  await updateDoc(providerDocRef, updates);
};

// DELETE a provider
export const deleteProviderForService = async (companyId: string, serviceId: string, providerId: string): Promise<void> => {
  const providerDocRef = doc(db, 'companies', companyId, 'services', serviceId, 'providers', providerId);
  await deleteDoc(providerDocRef);
};
// Queue Operations
export const joinQueue = async (
  companyId: string, 
  serviceId: string, 
  queueData: CreateQueueItem // Use the new, more precise type
): Promise<string> => {
  try {
    const queueRef = collection(db, 'companies', companyId, 'services', serviceId, 'queue');
    const positionQuery = query(queueRef, orderBy('position', 'desc'), limit(1));
    const positionSnap = await getDocs(positionQuery);
    
    // This logic remains the same and is perfect
    const nextPosition = positionSnap.empty ? 1 : positionSnap.docs[0].data().position + 1;

    const docRef = await addDoc(queueRef, {
      ...queueData, // Spread the client-side data
      position: nextPosition, // Add the calculated position
      status: 'waiting',      // Add the default status
      joinedAt: serverTimestamp() // Add the timestamp
    });

    return docRef.id;
  } catch (error) {
    console.error('Error joining queue:', error);
    throw error;
  }
};

export const getQueueByService = async (companyId: string, serviceId: string): Promise<QueueItem[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'companies', companyId, 'services', serviceId, 'queue'));
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as QueueItem));
  } catch (error) {
    console.error('Error getting queue by service:', error);
    return [];
  }
};

export const updateQueueItem = async (companyId: string, serviceId: string, queueItemId: string, updates: Partial<QueueItem>) => {
    const queueItemDocRef = doc(db, "companies", companyId, "services", serviceId, "queue", queueItemId);
    await updateDoc(queueItemDocRef, updates);
};

export const removeFromQueue = async (
  companyId: string, 
  serviceId: string, 
  queueItemId: string
): Promise<void> => {
  try {
    const docRef = doc(db, 'companies', companyId, 'services', serviceId, 'queue', queueItemId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error removing from queue:', error);
    throw error;
  }
};

// Users
export const createUser = async (userData: Omit<User, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'users'), {
      ...userData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as User : null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<void> => {
  try {
    const docRef = doc(db, 'users', id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Message Templates
export const createMessageTemplate = async (
  companyId: string, 
  serviceId: string, 
  templateData: Omit<MessageTemplate, 'id'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'companies', companyId, 'services', serviceId, 'messageTemplates'), {
      ...templateData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating message template:', error);
    throw error;
  }
};

export const getMessageTemplates = async (companyId: string, serviceId: string): Promise<MessageTemplate[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'companies', companyId, 'services', serviceId, 'messageTemplates'));
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as MessageTemplate));
  } catch (error) {
    console.error('Error getting message templates:', error);
    return [];
  }
};

// Real-time listeners
export const subscribeToQueue = (
  companyId: string, 
  serviceId: string, 
  callback: (queueItems: QueueItem[]) => void
) => {
  try {
    const queueRef = collection(db, 'companies', companyId, 'services', serviceId, 'queue');
    const q = query(queueRef, orderBy('position', 'asc'));
    
    return onSnapshot(q, (snapshot: any) => {
      const queueItems = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as QueueItem));
      callback(queueItems);
    });
  } catch (error) {
    console.error('Error subscribing to queue:', error);
    return () => {};
  }
};

export const subscribeToUserQueues = (
  userId: string, 
  callback: (queueItems: any[]) => void
) => {
  try {
    const userQueuesRef = collection(db, 'users', userId, 'joinedQueues');
    
    return onSnapshot(userQueuesRef, (snapshot: any) => {
      const queueItems = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      callback(queueItems);
    });
  } catch (error) {
    console.error('Error subscribing to user queues:', error);
    return () => {};
  }
};

// Search functions
export const searchServices = async (searchTerm: string, categoryId?: string): Promise<Service[]> => {
  try {
    // Use collection group search to get only active services first
    const constraints: any[] = [where('status', '==', 'active')];
    if (categoryId) {
      constraints.push(where('categoryId', '==', categoryId));
    }
    const servicesQuery = query(collectionGroup(db, 'services'), ...constraints);
    const servicesSnapshot = await getDocs(servicesQuery);

    const companiesSnapshot = await getDocs(collection(db, 'companies'));
    const companiesMap = new Map(
      companiesSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() } as Company])
    );

    const services: Service[] = servicesSnapshot.docs.map((serviceDoc: any) => {
      const serviceData = serviceDoc.data() as any;
      return {
        ...serviceData,
        id: serviceDoc.id,
        company: companiesMap.get(serviceData.companyId)
      } as unknown as Service;
    });

    const q = searchTerm.trim().toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return [];

    const matches = (text?: string) =>
      text ? tokens.some(t => text.toLowerCase().includes(t)) : false;

    return services.filter(service =>
      matches(service.name) ||
      matches(service.code) ||
      matches(service.company?.name) ||
      matches((service as any).description)
    );
  } catch (error) {
    console.error('Error searching services:', error);
    // Fallback: use active services loader and filter in memory
    try {
      let services = await getAllServices();
      if (categoryId) {
        services = services.filter(s => s.categoryId === categoryId);
      }
      const q = searchTerm.trim().toLowerCase();
      const tokens = q.split(/\s+/).filter(Boolean);
      if (tokens.length === 0) return [];
      const matches = (text?: string) =>
        text ? tokens.some(t => text.toLowerCase().includes(t)) : false;
      return services.filter(service =>
        matches(service.name) ||
        matches(service.code) ||
        matches(service.company?.name) ||
        matches((service as any).description)
      );
    } catch (fallbackError) {
      console.error('Fallback searchServices failed:', fallbackError);
      return [];
    }
  }
}; 

// Featured services: status active AND featureEnabled true
export const getFeaturedServices = async (): Promise<Service[]> => {
  try {
    const featuredQuery = query(
      collectionGroup(db, 'services'),
      where('status', '==', 'active'),
      where('featureEnabled', '==', true)
    );
    const snapshot = await getDocs(featuredQuery);
    const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));

    if (services.length > 0) {
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      const companiesMap = new Map(
        companiesSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() } as Company])
      );
      return services.map(service => ({
        ...service,
        company: companiesMap.get(service.companyId),
      }));
    }
    return services;
  } catch (error) {
    console.error('Error getting featured services:', error);
    // Fallback without collection group indexes
    try {
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      const companiesMap = new Map(
        companiesSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() } as Company])
      );
      const featuredServices: Service[] = [];
      for (const companyDoc of companiesSnapshot.docs) {
        const servicesSnap = await getDocs(
          query(
            collection(db, 'companies', companyDoc.id, 'services'),
            where('status', '==', 'active'),
            where('featureEnabled', '==', true)
          )
        );
        for (const svcDoc of servicesSnap.docs) {
          const data = svcDoc.data() as any;
          featuredServices.push({ id: svcDoc.id, ...data, company: companiesMap.get(data.companyId) } as Service);
        }
      }
      return featuredServices;
    } catch (fallbackError) {
      console.error('Fallback getFeaturedServices failed:', fallbackError);
      return [];
    }
  }
};

// Global stats for the landing page
export const getGlobalStats = async (): Promise<GlobalStatsData> => {
  try {
    // Define references to the collections we need to count
    const companiesRef = collection(db, 'companies');
    const usersRef = collection(db, 'users');
    
    // Define queries for collections that need filtering
    // Query for all active services across all companies
    const activeServicesQuery = query(
      collectionGroup(db, 'services'), 
      where('status', '==', 'active')
    );
    
    // Query for all completed ("served") queue items across all services
    const servicesCompletedQuery = query(
      collectionGroup(db, 'queue'), 
      where('status', '==', 'served')
    );

    // Run all count queries in parallel for maximum speed
    const [
      companiesSnap, 
      activeServicesSnap, 
      servicesCompletedSnap, 
      usersSnap
    ] = await Promise.all([
      getCountFromServer(companiesRef),
      getCountFromServer(activeServicesQuery),
      getCountFromServer(servicesCompletedQuery),
      getCountFromServer(usersRef)
    ]);

    // Return the data from the snapshots
    return {
      companiesCount: companiesSnap.data().count,
      activeServicesCount: activeServicesSnap.data().count,
      servicesCompletedCount: servicesCompletedSnap.data().count,
      usersCount: usersSnap.data().count,
    };
  } catch (error) {
    console.error('Error getting global stats:', error);
    // If any part of the process fails, return a default object with zeros
    // This prevents the entire stats section from crashing on the frontend
    return { 
      companiesCount: 0, 
      activeServicesCount: 0, 
      servicesCompletedCount: 0, 
      usersCount: 0 
    };
  }
};