export type UserRole = "company" | "user"
import { ANY_PROVIDER_ID } from "@/lib/constants";
export type Company = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  logo?: string;
  location?: string;
  socials?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
  } 
};
export type Service = {
  id: string;
  companyId: string;
  name: string;
  categoryId?: string; 
  description: string;
  estimatedWaitTime: number; // in minutes
  status: "active" | "inactive";
  code: string;
  createdAt: Date;
  providers: Provider[];
  price: string;
  company?: Company; 
  locationLink?: string;
 
  allowWalkIns: boolean;
  walkInBuffer: number;
  maxWalkInsPerHour: number;
  featureEnabled: boolean;
};

export type QueueItem = {
  id: string
  serviceId: string
  // FIX: providerId is now required. It will be 'any_provider' for the general queue.
  providerId: string 
  userName: string
  phoneNumber: string
  position: number
  joinedAt: Date
  status: "waiting" | "served" | "skipped" | "cancelled" | "no-show"
  estimatedServiceTime?: Date
  // This type is now perfectly aligned with our logic.
  queueType:string
  notes?: string
  priority?: "normal" | "high" | "urgent"
  appointmentTime?: Date
}

// ... your other types (Company, Service, etc.)
export type CreateQueueItem = {
  serviceId: string
  providerId: string 
  userName: string
  phoneNumber: string
  queueType: string
  userUid: string; // Including userUid as it's passed separately
  notes?: string
}
// This is the final shape of the data we want to display in the UI
export interface ServiceWithDetails extends Service {
  queueCount: number; // The number of people currently in the queue
  // company property is already part of your Service type if you added it
  company?: Company; 
}

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
  isActive: boolean;
  createdAt: Date;
  rating?: number;
  completedServices?: number;
  averageServiceTime?: number;
  isAny?: boolean; // This flag is very useful!
};

// This is your virtual "Any Provider" object. It conforms to the Provider type.
export const ANY_PROVIDER_OPTION: Provider = {
  id: ANY_PROVIDER_ID, // Use the constant here
  name: 'Any Available Specialist',
  specialization: 'General',
  isActive: true,
  createdAt: new Date(),
  isAny: true, // The special flag to easily identify this option
};


export type WalkInSettings = {
  enabled: boolean
  maxWalkInsPerHour: number
  bufferTime: number // minutes between appointments
  prioritySystem: boolean
  allowProviderSelection: boolean
  estimatedWaitMultiplier: number // multiply normal wait time for walk-ins
}
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
  value: string; // e.g., 'my_location', 'nyc', 'la'
  label: string; // e.g., 'Near Me', 'New York', 'Los Angeles'
  coordinates?: { lat: number; lon: number };
}

export interface FilterState {
  searchTerm: string;
  location: LocationOption | null;
  categoryId: string | null; // null means 'All Categories'
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

export interface LocationOption {
  value: string; // e.g., companyId
  label: string; // e.g., Company Name or City
  coordinates?: {
    lat: number;
    lon: number;
  };
}
//category service 
// ... your other types (Company, Service, etc.)

// This is the final shape of the data we want to display in the UI
export enum CategoryId {
  HAIRCUT = 'haircut',
  SPA_WELLNESS = 'spa-wellness',
  HEALTH = 'health',
  FITNESS = 'fitness',
  AUTOMOTIVE = 'automotive',
  FOOD = 'food',
  PET_SERVICES = 'pet-services',
}