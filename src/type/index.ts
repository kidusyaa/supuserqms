
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
  service_category?: { name: string }; // Use service_category to avoid conflict with `category_id`
  
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
  service?: Service;
  company?: Company;
  provider?: Provider;
  estimated_start_time?: string | null;
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
  service?: Service;
  company?: Company;
  provider?: Provider;
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