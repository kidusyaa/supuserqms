export type UserRole = "company" | "user"

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
  type: string;
  description: string;
  estimatedWaitTime: number; // in minutes
  status: "active" | "inactive";
  code: string;
  createdAt: Date;
  providers: Provider[];
  price: string;
  // Properties from your mock data that were missing in the original type:
  allowWalkIns: boolean;
  walkInBuffer: number;
  maxWalkInsPerHour: number;
  featureEnabled: boolean;
};

export type QueueItem = {
  id: string
  serviceId: string
  providerId?: string
  userName: string
  phoneNumber: string
  position: number
  joinedAt: Date
  status: "waiting" | "served" | "skipped" | "cancelled" | "no-show"
  estimatedServiceTime?: Date
  queueType: "general" | "provider-specific" | "walk-in" | "appointment"
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
  isActive: boolean;
  createdAt: Date;
  rating?: number;
  completedServices?: number;
  averageServiceTime?: number;
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