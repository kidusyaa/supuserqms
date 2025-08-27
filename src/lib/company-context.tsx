// src/lib/company-context.tsx

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabaseClient";
import { getCompanyAndAllData } from "./api";
import type { Company, Service, QueueItem, Provider } from "@/type";

// --- INTERFACE (Contract for our context) ---
interface CompanyContextType {
  company: Company | null;
  services: Service[];
  queueItems: QueueItem[];
  providers: Provider[];
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>; // Changed to Promise<void> to match async function
  updateCompanyProfile: (updates: Partial<Company>) => Promise<void>;
  createNewService: (serviceData: Omit<Service, "id" | "companyId">) => Promise<string>;
  updateServiceData: (serviceId: string, updates: Partial<Service>) => Promise<void>;
  deleteServiceData: (serviceId: string) => Promise<void>;
  createNewProvider: (providerData: Omit<Provider, "id">) => Promise<string>;
  updateQueueItemStatus: (serviceId: string, queueItemId: string, status: QueueItem["status"]) => Promise<void>;
  assignProviderToQueueItem: (queueItemId: string, serviceId: string, targetProviderId: string) => Promise<void>;
  updateQueueItemPositions: (serviceId: string, reorderedItems: QueueItem[]) => Promise<void>;
  refreshData: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // --- Core Session and Data Loading Logic (Already Correct) ---
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await loadCompanyData(session.user.id);
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const loadCompanyData = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const companyData = await getCompanyAndAllData(userId);
      if (companyData) {
        setCompany(companyData);
        setServices(companyData.services || []);
        setProviders(companyData.providers || []);
        const allQueueItems = companyData.services?.flatMap(s => s.queue_entries || []) || [];
        setQueueItems(allQueueItems);
      } else {
        await logout(); // Use the new async logout
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load company data");
    } finally {
      setLoading(false);
    }
  };
  
  const refreshData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await loadCompanyData(user.id);
    }
  };

  // --- Core Auth Logic (Already Correct) ---
  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Login failed, user not found.");
      await loadCompanyData(authData.user.id);
      return true;
    } catch (err: any) {
      setError(err.message || "Login failed.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCompany(null);
    setServices([]);
    setQueueItems([]);
    setProviders([]);
    setError(null);
    router.push("/company-login");
  };

  // --- PLACEHOLDER FUNCTIONS TO FIX THE ERROR ---
  // We will replace these with real logic later.

  const updateCompanyProfile = async (updates: Partial<Company>) => {
    console.warn("updateCompanyProfile function is not yet implemented with Supabase.");
    // In the future, this will call a Supabase update function.
  };

  const createNewService = async (serviceData: Omit<Service, "id" | "companyId">): Promise<string> => {
    console.warn("createNewService function is not yet implemented with Supabase.");
    return "mock-service-id";
  };

  const updateServiceData = async (serviceId: string, updates: Partial<Service>) => {
    console.warn("updateServiceData function is not yet implemented with Supabase.");
  };

  const deleteServiceData = async (serviceId: string) => {
    console.warn("deleteServiceData function is not yet implemented with Supabase.");
  };

  const createNewProvider = async (providerData: Omit<Provider, "id">): Promise<string> => {
    console.warn("createNewProvider function is not yet implemented with Supabase.");
    return "mock-provider-id";
  };

  const updateQueueItemStatus = async (serviceId: string, queueItemId: string, status: QueueItem["status"]) => {
    console.warn("updateQueueItemStatus function is not yet implemented with Supabase.");
  };

  const assignProviderToQueueItem = async (queueItemId: string, serviceId: string, targetProviderId: string) => {
    console.warn("assignProviderToQueueItem function is not yet implemented with Supabase.");
  };

  const updateQueueItemPositions = async (serviceId: string, reorderedItems: QueueItem[]) => {
    console.warn("updateQueueItemPositions function is not yet implemented with Supabase.");
  };

  // --- VALUE OBJECT (Now includes all required functions) ---
  const value: CompanyContextType = {
    company,
    services,
    queueItems,
    providers,
    loading,
    error,
    login,
    logout,
    // Add all the placeholder functions to the value object
    updateCompanyProfile,
    createNewService,
    updateServiceData,
    deleteServiceData,
    createNewProvider,
    updateQueueItemStatus,
    assignProviderToQueueItem,
    updateQueueItemPositions,
    refreshData,
  };

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}