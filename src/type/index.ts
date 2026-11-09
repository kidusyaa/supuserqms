export type UserRole = "company" | "user";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type PaymentStatus = "not_required" | "pending" | "approved" | "rejected";

export type QueueTypeStatus = 'walk_in' | 'online' | 'scheduled' | 'other';

export type QueueEntryStatus = 'waiting' | 'serving' | 'served' | 'noshow' | 'cancelled';

export type BankAccount = {
  id: string;
  account_type: string;
  account_user_name: string;
  account_number: string;
  is_active?: boolean;
};

export type Company = {
  id: string;
  name: string;
  slug?: string;
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
  license?: string | null;
  bank_accounts: BankAccount[];
  company_photos?: CompanyPhoto[];
  // --- DEPRECATED: Keep for backward compatibility during migration ---
  bank_name?: string | null;
  account_name?: string | null;
  account_number?: string | null;
  rating_summary?: {
    average_stars: number;
    total_ratings: number;
  } | null;
};

export interface CompanyPhoto {
  id: string;
  company_id: string;
  url: string;
  type: 'venue' | 'gallery';
  created_at?: string;
}

interface ServicePhoto {
  url: string;
}

export type ServiceVariant = {
  id: string;
  service_id: string;
  name: string;
  duration_mins?: number | null;
  price: string | number | null;
  price_type?: 'fixed' | 'call_for_price';
  discount_type?: 'percentage' | 'fixed' | null;
  discount_value?: number | null;
  discount_end_date?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

// --- SERVICE COMPONENTS (Multi-step Phases & Add-ons) ---
export type ServiceComponentType = 'phase' | 'addon';

export interface ServiceComponent {
  id: string;
  service_id: string;
  name: string;
  component_type: ServiceComponentType;
  description: string | null;
  price: number;
  duration_mins: number;
  is_required: boolean;
  is_included: boolean;
  is_overlappable: boolean;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type CreateServiceComponentInput = Omit<ServiceComponent, 'id' | 'created_at' | 'updated_at'>;
export type UpdateServiceComponentInput = Partial<CreateServiceComponentInput>;

export interface BookingComponent {
  id: string;
  booking_id: string;
  component_id: string;
  provider_id?: string | null;
  quantity: number;
  price_at_booking: number;
  duration_mins: number;
  created_at?: string;
  component?: ServiceComponent | null;
  provider?: Provider | null;
}

export interface QueueComponent {
  id: string;
  queue_entry_id: string | number;
  component_id: string;
  quantity?: number;
  price_at_queue: number;
  duration_mins: number;
  created_at?: string;
  component?: ServiceComponent | null;
}

export interface PaymentVerification {
  id: string;
  booking_id?: string | null;
  booking_group_id?: string | null;
  status: 'submitted' | 'approved' | 'rejected';
  amount_paid?: number | null;
  proof_image_url?: string | null;
  telegram_chat_id?: number | null;
  telegram_message_id?: number | null;
  submitted_at: string;
  verified_at?: string | null;
  verified_by_telegram_id?: number | null;
  rejection_reason?: string | null;
}

export type PackageItem = {
  id: string;
  package_id?: string;
  service_id?: string;
  item_type: 'service' | 'custom';
  linked_service_id?: string | null;
  linked_variant_id?: string | null;
  service_variant_id?: string | null;
  custom_name?: string | null;
  quantity?: number;
  display_order?: number;
  created_at?: string;
  linked_service?: Service;
  service?: Service;
  linked_variant?: ServiceVariant;
  service_variant?: ServiceVariant;
};

export type Service = {
  id: string;
  company_id: string;
  name: string;
  category_id: string | null; 
  description: string;
  estimated_wait_time_mins: number;
  status: "active" | "inactive";
  code: string;
  created_at: Date;
  providers?: Provider[]; 
  price: string | null;
  photo?: string | null;
  featureEnabled?: boolean;
  company?: Company;      
  queue_entries?: QueueItem[]; 
  service_photos?: ServicePhoto[];
  discount_type: 'percentage' | 'fixed' | null;
  discount_value: number | null; 
  discount_end_date?: string | null;
  service_category?: { name: string };
  requires_prepayment: boolean;
  prepayment_amount?: number | null;
  is_package?: boolean | null;
  included_service_ids?: string[] | string | null;
  included_services?: Service[];
  video_url?: string | null;
  video_platform?: string | null;
  is_price_visible?: boolean | null;
  has_variants?: boolean | null;
  description_points?: string[] | null;
  service_variants?: ServiceVariant[];
  package_items?: PackageItem[];
  // Components (Multi-step Phases & Add-ons)
  components?: ServiceComponent[];
  service_components?: ServiceComponent[];
};

export type ServiceWithComponents = Service & {
  components: ServiceComponent[];
};

export type QueueItem = {
  id: number; // bigint from DB
  service_id: string;
  provider_id: string | null;
  user_name: string;
  phone_number: string | null;
  status: 'waiting' | 'serving' | 'served' | 'noshow' | 'cancelled';
  position: number | null;
  queue_type: 'walk-in' | 'booking' | null;
  notes: string | null;
  joined_at: string; // ISO string from DB
  served_at: string | null;
  user_id: string | null;
  projected_start_time?: string | null;
  projected_end_time?: string | null;
  service_variant_id?: string | null;
  original_price?: number | null;
  discount_amount?: number | null;
  final_price?: number | null;
  service_variant?: ServiceVariant;
  service?: Service;
  queue_components?: QueueComponent[];
};

export interface AugmentedQueueItem extends QueueItem {
  estimatedServiceStartTime?: Date | null;
  estimatedServiceEndTime?: Date | null;
}

export interface Booking {
  id: string;
  user_id: string | null;
  user_name: string;
  phone_number: string | null;
  service_id: string;
  company_id: string;
  provider_id: string | null;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  payment_status?: PaymentStatus;
  created_at: string;
  notes: string | null;
  payment_proof?: string | null;
  service_variant_id?: string | null;
  original_price?: number | null;
  discount_amount?: number | null;
  final_price?: number | null;
  amount_paid?: number | null;
  prepayment_amount?: number | null;
  booking_group_id?: string | null;
  booking_components?: BookingComponent[];
  service_variant?: ServiceVariant;
  service?: Service;
  company?: Company;
  provider?: Provider;
}

export interface DailyWorkingHours {
  start: Date;
  end: Date;
}

export type ParsedWorkingHours = {
  [key: number]: DailyWorkingHours[];
};

export interface WorkingHoursForDay {
  start: string;
  end: string;
}

export interface WorkingHoursJsonb {
  [dayIndex: number]: WorkingHoursForDay[];
}

export interface AvailableSlot {
  start: Date;
  end: Date;
  formattedTime: string;
  isBooked: boolean;
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
  company_id: string;
  isAny?: boolean;
};

export const ANY_PROVIDER_ID = "any_provider_id"; 

export const ANY_PROVIDER_OPTION: Provider = {
  id: ANY_PROVIDER_ID, 
  name: 'Any Available Provider',
  specialization: 'General',
  is_active: true,
  created_at: new Date().toISOString(), 
  isAny: true, 
  company_id: "",
};

export type Category = {
  id: string;
  name: string;
  description: string | null; 
  icon: string | null; 
  parent_category_id: string | null;
  created_at: string;
  services?: number | null; 
  children?: Category[];
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
  company_count: number;
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
  companyTypeIds: string[];
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

// --- CART & MULTI-SERVICE BOOKING TYPES ---
export interface SelectedComponent {
  id: string;
  component_id: string;
  name: string;
  price: number;
  duration_mins: number;
  is_required: boolean;
  is_included: boolean;
  is_overlappable: boolean;
  component_type: ServiceComponentType;
  quantity?: number;
}

export interface PriceBreakdown {
  basePrice: number;
  addonsPrice: number;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  hasDiscount: boolean;
  discountLabel?: string | null;
  isCallForPrice: boolean;
  isStartingFrom?: boolean;
}

export interface SelectedServiceItem {
  cartItemId: string; // Unique cart line item ID
  service: Service;
  variant: ServiceVariant | null;
  provider: Provider | null;
  selectedComponents: ServiceComponent[];
  priceBreakdown: PriceBreakdown;
  durationMins: number; // sequential elapsed appointment time
  totalWorkloadMins: number; // total work duration including overlappable
  selectedDate?: string | null; // ISO string
  selectedSlot?: AvailableSlot | null;
  notes?: string | null;
}

export interface MarketplaceBookingComponentInput {
  component_id: string;
  provider_id?: string | null;
  quantity?: number;
  price_at_booking?: number;
  duration_mins?: number;
}

export interface MarketplaceBookingInput {
  service_id: string;
  company_id: string;
  provider_id?: string | null;
  service_variant_id?: string | null;
  start_time: string;
  end_time: string;
  user_name: string;
  phone_number: string | number;
  notes?: string | null;
  booking_group_id?: string | null;
  components?: MarketplaceBookingComponentInput[];
  selected_component_ids?: string[];
  original_price?: number | null;
  discount_amount?: number | null;
  final_price?: number | null;
}

export interface MultiServiceBookingPayload {
  company_id: string;
  user_name: string;
  phone_number: string | number;
  booking_group_id?: string | null;
  notes?: string | null;
  bookings: Array<{
    service_id: string;
    service_variant_id?: string | null;
    provider_id?: string | null;
    start_time: string;
    end_time: string;
    components?: MarketplaceBookingComponentInput[];
    selected_component_ids?: string[];
    notes?: string | null;
  }>;
}

export interface QueueComponentInput {
  component_id: string;
  price_at_queue?: number;
  duration_mins?: number;
}

export interface MarketplaceQueueInput {
  service_id: string;
  provider_id?: string | null;
  service_variant_id?: string | null;
  user_name?: string;
  phone_number?: string;
  notes?: string | null;
  queue_type?: 'walk_in' | 'online' | 'scheduled';
  components?: QueueComponentInput[];
  selected_component_ids?: string[];
  original_price?: number | null;
  discount_amount?: number | null;
  final_price?: number | null;
}
