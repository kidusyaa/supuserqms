// export type UserRole = "company" | "user"
// import { ANY_PROVIDER_ID } from "@/lib/constants";
// import { Timestamp } from "firebase/firestore";
// export type Company = {
//   id: string;
//   name: string;
//   phone: string;
//   email: string;
//   address: string;
//   working_hours: string;
//   logo?: string;
//   location_text: string;
//   location_link: string;
//   owner_uid: string; // The UID of the user who owns this company
//   createdAt?: Timestamp | Date;
//   socials?: {
//     facebook?: string;
//     instagram?: string;
//     tiktok?: string;
//     website?: string;
//   } 
//   services?: Service[];  // An array of Service objects
//   providers?: Provider[];
// };
// export type Service = {
//   id: string;
//   company_id: string;
//   name: string;
//   category_id: string; // Category for this specific service
//   description: string;
//   estimated_wait_time_mins: number; // in minutes
//   status: "active" | "inactive";
//   code: string;
//   createdAt: Date;
//   providers: Provider[];
//   price: string;
//   photo?: string;
//   featureEnabled: true;
//     // An array of Provider objects linked via service_providers
//   company?: Company;      // The nested company object

import { Qahiri } from "next/font/google";

  
//   queue_entries?: QueueItem[]; 
// };

// // src/type.ts

// export type QueueItem = {
//   id: string;
//   service_id: string;
//   provider_id: string | null; // Provider can be null
//   user_uid: string | null;    // user_uid can be null
//   user_name: string;
//   phone_number: string;
//   status: "waiting" | "served" | "no-show" | "cancelled";
//   position: number;
//   queue_type: "walk-in" | "booking";
//   notes?: string;
//   appointment_time?: Date | string;
//   // --- THE FIX: Change `created_at` to `joined_at` ---
//   joined_at: Date | string; 
// };

// // Your CreateQueuePayload does not need to be changed.
// // It's correct because we don't send the timestamp from the client.
// export type ServiceWithDetails = Service & {
//   company?: Company; // The company object, can be optional
//   queueCount: number; // The calculated number of people in the queue
// };
// export type User = {
//   id: string
//   phoneNumber: string
//   name?: string
//   activeQueues: string[] // queue item IDs
// }
// export type Provider = {
//   id: string;
//   name: string;
//   specialization: string;
//  is_active: boolean; // <-- CHANGED to snake_case
  
//   createdAt: Date;
//   isAny?: boolean; // This flag is very useful!
// };
// export const ANY_PROVIDER_OPTION: Provider = {
//   id: ANY_PROVIDER_ID, // Use the constant here
//   name: 'Any Provider',
//   specialization: 'General',
//   is_active: true,// <-- CHANGED to snake_case
//   createdAt: new Date(),
//   isAny: true, // The special flag to easily identify this option
// };


// export type Category = {
//   id: string;
//   name: string;
//   description: string;
//   icon: string;

//   services: number;
//    // make optional to match mock
// };
// // types/filters.ts
// export interface LocationOption {
//   id: string;
//   value: string;
//   label: string;
// }
// export interface Location {
//   id: string;
//   city: string;
//   place: string;
// }
// export interface FilterState {
//   searchTerm: string;
//   locations: LocationOption[]; 
//   categoryId: string | null; 
//   companyIds: string[]; 

//   // For a potential "My Favorites" filter
// }
// export type MessageTemplate = {
//   id: string
//   name: string
//   content: string
//   type: "delay" | "ready" | "custom"| "interruption" | "resumption" | "cancellation"
// }
// // Add a virtual provider object to represent the "Any Provider" queue.
// // This allows us to treat it uniformly in our UI.

// // in src/type.ts (or a similar file)

// // This represents the data collected from the new Add/Edit Service Form
// export interface ServiceRegistrationData {
//   serviceName: string;
//   categoryId: string;
//   description: string;
//   cost: string;
//   offers: string;
//   estimatedTime: string;
//   serviceProviders: Array<{ name: string; specialization: string }>;
//   photos: File[];
//   allowWalkIns: boolean;
//   walkInBuffer: number;
//   maxWalkInsPerHour: number;
// }
// export interface LocationOption {
//   id: string;
//   value: string;
//   label: string;
// }
// export interface GlobalStatsData {
//   companiesCount: number;
//   activeServicesCount: number;
//   servicesCompletedCount: number;
//   usersCount: number;
// }
// src/type.ts

export type UserRole = "company" | "user";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type QueueTypeStatus = 'walk_in' | 'online' | 'scheduled' | 'other'; // Adjust 'other' as needed for your DB enum values

// --- Ensure your QueueEntryStatus for the 'status' column is also correct ---
export type QueueEntryStatus = 'waiting' | 'serving' | 'completed' | 'cancelled';
export type Company = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  working_hours: WorkingHoursJsonb | null;
  logo?: string | null;
  location_text: string | null;
  location_link: string | null;
  owner_uid: string;
  created_at?: string;
  socials?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    website?: string;
  } | null;
  company_types?: CompanyType[];
  services?: Service[];
  providers?: Provider[];
};

export type Service = {
  id: string;
  company_id: string;
  name: string;
  category_id: string; 
  description: string ;
  estimated_wait_time_mins: number;
  status: "active" | "inactive";
  code: string ;
  created_at: Date;
  providers?: Provider[]; 
  price: string | null;
  photo?: string | null;
  featureEnabled?: boolean; // Changed to boolean, default handled in mapping
  company?: Company;      
  queue_entries?: QueueItem[]; 
  service_photos?: { url: string }[];
  discount_type: 'percentage' | 'fixed' | null;
  discount_value: number | null; 
  
};

export type QueueItem = {
  id: string;
  user_id: string | null; // As per your DB schema
  user_name: string;
  phone_number: string | null;
  service_id: string;
  provider_id: string | null;
  joined_at: string; // ISO string
  status: QueueEntryStatus; // Use the defined union type
  position: number | null; // Use position as per DB, and allow null as it might be set by trigger
  queue_type: QueueTypeStatus; // <-- Use the defined union type here
  notes: string | null;
  // company_id: string; // Removed this earlier, ensure it's not here
};

export interface Booking {
  id: string;
  user_id: string | null;
  user_name: string;
  phone_number: string | null; // <--- CHANGED: To allow null, matching your component's usage
  service_id: string;
  company_id: string;
  provider_id: string | null;
  start_time: string; // ISO 8601 string
  end_time: string;   // ISO 8601 string
  status: BookingStatus;
  created_at: string;
  notes: string | null;
}
export interface DailyWorkingHours {
  start: Date; // Time component only (e.g., 9:00 AM on a dummy date)
  end: Date;   // Time component only (e.g., 5:00 PM on a dummy date)
}

export type ParsedWorkingHours = {
  [key: number]: DailyWorkingHours[]; // Key: Day of week (0=Sun, 1=Mon, ...), Value: Array of time ranges
};
export interface WorkingHoursForDay {
  start: string; // HH:mm format, e.g., "08:00"
  end: string;   // HH:mm format, e.g., "17:00"
}

export interface WorkingHoursJsonb {
  [dayIndex: number]: WorkingHoursForDay[]; // Day index 0-6 (Sun-Sat)
}
export interface AvailableSlot {
  start: Date; // Full date-time for the slot
  end: Date;   // Full date-time for the slot
  formattedTime: string; // e.g., "9:00 AM"
}
export type ServiceWithDetails = Service & {
  company?: Company; 
  queueCount: number; 
};

export type User = {
  id: string;
  phone_number: string; 
  name?: string | null; 
  activeQueues: string[]; 
};

export type Provider = {
  id: string;
  name: string;
  specialization: string | null; 
  is_active: boolean; 
  created_at: string; 
  company_id: string; // Providers must belong to a company
  isAny?: boolean; // Flag for 'Any Provider' option
};

export const ANY_PROVIDER_ID = "any_provider_id"; 

export const ANY_PROVIDER_OPTION: Provider = {
  id: ANY_PROVIDER_ID, 
  name: 'Any Available Provider', // Changed name for clarity in UI
  specialization: 'General',
  is_active: true, // Always active for selection
  created_at: new Date().toISOString(), 
  isAny: true, 
  company_id: "", // A placeholder for this virtual provider
};

export type Category = {
  id: string;
  name: string;
  description: string | null; 
  icon: string | null; 
  parent_category_id: string | null;
  created_at: string;
  services?: number | null; 
  children?: Category[]; // For hierarchical display
};

export type CompanyType = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
};
export type CompanyTypeWithCount = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  company_count: number; // Supabase returns bigint as a number in JS
};

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
}

export type MessageTemplate = {
  id: string;
  name: string;
  content: string;
  type: "delay" | "ready" | "custom"| "interruption" | "resumption" | "cancellation";
};

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

export interface GlobalStatsData {
  companiesCount: number;
  activeServicesCount: number;
  servicesCompletedCount: number;
  usersCount: number;
}
export interface FilterState {
  searchTerm: string;
  locations: LocationOption[]; // Array of selected location options
  categoryId: string | null;   // ID of selected category
  companyIds: string[];        // Array of selected company IDs
  companyTypeIds: string[];    // Array of selected company type IDs
}