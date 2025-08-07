"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Company, Service, QueueItem, Provider } from '@/type'
import { 
  getCompanyById, 
  getServicesByCompany, 
  getQueueByService, 
  getProvidersByService,
  subscribeToQueue,
  updateCompany,
  updateService,
  createService,
  deleteService,
  createProviderForService,
  updateQueueItem
} from './firebase-utils'

interface CompanyContextType {
  company: Company | null
  services: Service[]
  queueItems: QueueItem[]
  providers: Provider[]
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  updateCompanyProfile: (updates: Partial<Company>) => Promise<void>
  createNewService: (serviceData: Omit<Service, 'id' | 'companyId'>) => Promise<string>
  updateServiceData: (serviceId: string, updates: Partial<Service>) => Promise<void>
  deleteServiceData: (serviceId: string) => Promise<void>
  createNewProvider: (serviceId: string, providerData: Omit<Provider, 'id'>) => Promise<string>
  updateQueueItemStatus: (serviceId: string, queueItemId: string, status: QueueItem['status']) => Promise<void>
   assignProviderToQueueItem: (queueItemId: string, serviceId: string, targetProviderId: string) => Promise<void>;
  refreshData: () => Promise<void>
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Check for stored company data on mount
  useEffect(() => {
    const storedCompany = localStorage.getItem('companyData')
    if (storedCompany) {
      try {
        const companyData = JSON.parse(storedCompany)
        setCompany(companyData)
        loadCompanyData(companyData.id)
      } catch (err) {
        console.error('Error parsing stored company data:', err)
        localStorage.removeItem('companyData')
      }
    } else {
      setLoading(false)
    }
  }, [])

  const loadCompanyData = async (companyId: string) => {
    try {
      setLoading(true)
      setError(null)

      // Load company data
      const companyData = await getCompanyById(companyId)
      if (!companyData) {
        throw new Error('Company not found')
      }
      setCompany(companyData)

      // Load services
      const servicesData = await getServicesByCompany(companyId)
      setServices(servicesData)

      // Load providers for all services
      const allProviders: Provider[] = []
      for (const service of servicesData) {
        const serviceProviders = await getProvidersByService(companyId, service.id)
        allProviders.push(...serviceProviders)
      }
      setProviders(allProviders)

      // Load queue items for all services
      const allQueueItems: QueueItem[] = []
      for (const service of servicesData) {
        const serviceQueueItems = await getQueueByService(companyId, service.id)
        allQueueItems.push(...serviceQueueItems)
      }
      setQueueItems(allQueueItems)

    } catch (err) {
      console.error('Error loading company data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load company data')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/company-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        const companyData = data.company
        
        // Store in localStorage
        localStorage.setItem('companyData', JSON.stringify(companyData))
        
        // Set company and load data
        setCompany(companyData)
        await loadCompanyData(companyData.id)
        
        return true
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Login failed')
        return false
      }
    } catch (err) {
      setError('Network error. Please try again.')
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('companyData')
    setCompany(null)
    setServices([])
    setQueueItems([])
    setProviders([])
    setError(null)
    router.push('/company-login')
  }

  const updateCompanyProfile = async (updates: Partial<Company>) => {
    if (!company) throw new Error('No company loaded')
    
    try {
      await updateCompany(company.id, updates)
      setCompany(prev => prev ? { ...prev, ...updates } : null)
      
      // Update stored data
      const updatedCompany = { ...company, ...updates }
      localStorage.setItem('companyData', JSON.stringify(updatedCompany))
    } catch (err) {
      console.error('Error updating company profile:', err)
      throw err
    }
  }

  const createNewService = async (serviceData: Omit<Service, 'id' | 'companyId'>): Promise<string> => {
    if (!company) throw new Error('No company loaded')
    
    try {
      const serviceId = await createService(company.id, serviceData)
      await refreshData() // Reload all data
      return serviceId
    } catch (err) {
      console.error('Error creating service:', err)
      throw err
    }
  }

  const updateServiceData = async (serviceId: string, updates: Partial<Service>) => {
    if (!company) throw new Error('No company loaded')
    
    try {
      await updateService(company.id, serviceId, updates)
      setServices(prev => prev.map(service => 
        service.id === serviceId ? { ...service, ...updates } : service
      ))
    } catch (err) {
      console.error('Error updating service:', err)
      throw err
    }
  }

  const deleteServiceData = async (serviceId: string) => {
    if (!company) throw new Error('No company loaded')
    
    try {
      await deleteService(company.id, serviceId)
      setServices(prev => prev.filter(service => service.id !== serviceId))
      setQueueItems(prev => prev.filter(item => item.serviceId !== serviceId))
    } catch (err) {
      console.error('Error deleting service:', err)
      throw err
    }
  }

  const createNewProvider = async (serviceId: string, providerData: Omit<Provider, 'id'>): Promise<string> => {
    if (!company) throw new Error('No company loaded')
    
    try {
      const providerId = await createProviderForService(company.id, serviceId, providerData)
      await refreshData() // Reload all data
      return providerId
    } catch (err) {
      console.error('Error creating provider:', err)
      throw err
    }
  }

  const updateQueueItemStatus = async (serviceId: string, queueItemId: string, status: QueueItem['status']) => {
    if (!company) throw new Error('No company loaded');
    try {
      await updateQueueItem(company.id, serviceId, queueItemId, { status });
      // Remove the item from the queue if served
      if (status === 'served') {
          setQueueItems(prev => prev.filter(item => item.id !== queueItemId));
      } else {
          // Otherwise, just update its status
          setQueueItems(prev => prev.map(item => 
            item.id === queueItemId ? { ...item, status } : item
          ));
      }
    } catch (err) {
      console.error('Error updating queue item:', err);
      throw err;
    }
  };
    const assignProviderToQueueItem = async (
    queueItemId: string,
    serviceId: string,
    targetProviderId: string
  ) => {
    if (!company) throw new Error("Company not loaded");

    // We use the current state to calculate the new position.
    const itemToMove = queueItems.find(item => item.id === queueItemId);
    if (!itemToMove) {
        console.error("Could not find the item to assign.");
        return;
    }

    const targetQueue = queueItems.filter(
      (item) => item.providerId === targetProviderId && item.status === "waiting"
    );
    const newPosition = targetQueue.length + 1;

    // Prepare the update payload for Firestore
    const updates = {
      providerId: targetProviderId,
      position: newPosition,
      queueType: "provider-specific" as const,
    };

    try {
      // 1. Update the document in Firebase
      await updateQueueItem(company.id, serviceId, queueItemId, updates);

      // 2. Manually update the local state to reflect the change instantly
      setQueueItems(prevItems => {
          // Remove the item from its old position
          const itemsWithoutMoved = prevItems.filter(item => item.id !== queueItemId);
          
          // Re-calculate positions for the queue the item LEFT
          const updatedOldQueue = itemsWithoutMoved.map(item => {
              if (item.providerId === itemToMove.providerId && item.position > itemToMove.position) {
                  return { ...item, position: item.position - 1 };
              }
              return item;
          });
          
          // Add the updated item back into the list
          return [...updatedOldQueue, { ...itemToMove, ...updates }];
      });

      // You could also just call refreshData() for a simpler, full refresh,
      // but the manual update provides a faster UI response.
      // await refreshData();

    } catch (err) {
      console.error('Error assigning provider:', err);
      throw err;
    }
  };

  const refreshData = async () => {
    if (!company) return
    await loadCompanyData(company.id)
  }

  const value: CompanyContextType = {
    company,
    services,
    queueItems,
    providers,
    loading,
    error,
    login,
    logout,
    updateCompanyProfile,
    createNewService,
    updateServiceData,
    deleteServiceData,
    createNewProvider,
    updateQueueItemStatus,
    assignProviderToQueueItem,
    refreshData
  }

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider')
  }
  return context
} 