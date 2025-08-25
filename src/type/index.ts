export type UserRole = "company" | "user"
import { ANY_PROVIDER_ID } from "@/lib/constants";
import { Timestamp } from "firebase/firestore";
export type Company = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  working_hours: string;
  logo?: string;
  location_text: string;
  location_link: string;
  owner_uid: string; // The UID of the user who owns this company
  createdAt?: Timestamp | Date;
  socials?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    website?: string;
  } 
  services?: Service[];  // An array of Service objects
  providers?: Provider[];
};
export type Service = {
  id: string;
  company_id: string;
  name: string;
  category_id: string; // Category for this specific service
  description: string;
  estimated_wait_time_mins: number; // in minutes
  status: "active" | "inactive";
  code: string;
  createdAt: Date;
  providers: Provider[];
  price: string;
  photo?: string;
  featureEnabled: true;
    // An array of Provider objects linked via service_providers
  company?: Company;      // The nested company object
  
  queue_entries?: QueueItem[]; 
};

export type QueueItem = {
  id: string
  serviceId: string
  // FIX: providerId is now required. It will be 'any_provider' for the general queue.
  providerId: string 
  userName: string
  phoneNumber: string
  position: number
  joinedAt: Timestamp | Date
  servedAt?: any;
  status: "waiting" | "served" | "skipped" | "cancelled" | "no-show"
  estimatedServiceTime?: Date
  // This type is now perfectly aligned with our logic.
  queueType:string
  notes?: string
  priority?: "normal" | "high" | "urgent"
  appointmentTime?: Date
  
}

export type ServiceWithDetails = Service & {
  company?: Company; // The company object, can be optional
  queueCount: number; // The calculated number of people in the queue
};
export type User = {
  id: string
  phoneNumber: string
  name?: string
  activeQueues: string[] // queue item IDs
}
export type Provider = {
  id: string;
  name: string;
  specialization: string;
 is_active: boolean; // <-- CHANGED to snake_case
  
  createdAt: Date;
  isAny?: boolean; // This flag is very useful!
};
export const ANY_PROVIDER_OPTION: Provider = {
  id: ANY_PROVIDER_ID, // Use the constant here
  name: 'Any Provider',
  specialization: 'General',
  is_active: true,// <-- CHANGED to snake_case
  createdAt: new Date(),
  isAny: true, // The special flag to easily identify this option
};


export type Category = {
  id: string;
  name: string;
  image:string;
  description: string;
  icon: string;
  gradient: string;
  services: number;
  avgWait: string;
  popular?: boolean; // make optional to match mock
  trending?: boolean; // make optional to match mock
};
// types/filters.ts
export interface LocationOption {
  id: string;
  value: string;
  label: string;
}
export interface Location {
  id: string;
  city: string;
  place: string;
}
export interface FilterState {
  searchTerm: string;
  locations: LocationOption[]; 
  categoryId: string | null; 
  companyIds: string[]; 
  showNoQueue: boolean;
  isFavorite: boolean; // For a potential "My Favorites" filter
}
export type MessageTemplate = {
  id: string
  name: string
  content: string
  type: "delay" | "ready" | "custom"| "interruption" | "resumption" | "cancellation"
}
// Add a virtual provider object to represent the "Any Provider" queue.
// This allows us to treat it uniformly in our UI.

// in src/type.ts (or a similar file)

// This represents the data collected from the new Add/Edit Service Form
export interface ServiceRegistrationData {
  serviceName: string;
  categoryId: string;
  description: string;
  cost: string;
  offers: string;
  estimatedTime: string;
  serviceProviders: Array<{ name: string; specialization: string }>;
  photos: File[];
  allowWalkIns: boolean;
  walkInBuffer: number;
  maxWalkInsPerHour: number;
}
export interface LocationOption {
  id: string;
  value: string;
  label: string;
}
export interface GlobalStatsData {
  companiesCount: number;
  activeServicesCount: number;
  servicesCompletedCount: number;
  usersCount: number;
}