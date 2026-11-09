// Supabase utilities - Complete replacement for firebase-utils.ts

import { supabase } from './supabaseClient';

import type { 

  Company, 

  Service, 

  QueueItem, 

  User, 

  Category, 

  CompanyType,

  Provider, 

  Booking,

  BookingStatus, 

  PaymentStatus,

  QueueEntryStatus,

  MessageTemplate, 

  Location,

  LocationOption,

  GlobalStatsData,

  FilterState, 

  CompanyTypeWithCount,

  AugmentedQueueItem,

  ServiceVariant,

  PackageItem,

  ServiceComponent,

  BookingComponent,

  QueueComponent,

  MarketplaceBookingComponentInput,

  MarketplaceBookingInput,

  MultiServiceBookingPayload,

  QueueComponentInput,

  PriceBreakdown,

} from '../type';
import { ANY_PROVIDER_ID } from '../type';

import { addDays, addMinutes, isAfter, max, min, startOfDay, endOfDay, isBefore, format, getDay, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';

export type CategoryWithServices = Category & {

  services: Service[];

};

import { parseWorkingHours, getDayRange, generateAvailableSlots } from './booking-utils';



const SERVICE_IMAGES_BUCKET = 'service-images';

export type UserProfile = {
  id: string; // uuid (auth.users.id)
  name: string | null;
  email: string | null;
  phone_number: string | null;
  avatar_id: string | null;
  created_at: string | null;
};

class AuthRequiredError extends Error {
  code = "AUTH_REQUIRED" as const;
  constructor(message: string = "Please sign in to continue.") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

class ProfileIncompleteError extends Error {
  code = "PROFILE_INCOMPLETE" as const;
  constructor(message: string = "Please complete your profile (name and phone number) to continue.") {
    super(message);
    this.name = "ProfileIncompleteError";
  }
}

export async function getAuthUserOrNull(): Promise<SupabaseAuthUser | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export async function getMyProfileOrNull(): Promise<UserProfile | null> {
  const user = await getAuthUserOrNull();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, phone_number, avatar_id, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  if (data) return data as UserProfile;

  const { data: created, error: createError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        name: null,
        email: user.email ?? null,
        phone_number: null,
        avatar_id: null,
      },
      { onConflict: "id" }
    )
    .select("id, name, email, phone_number, avatar_id, created_at")
    .single();

  if (createError || !created) {
    console.error("Error creating profile:", createError);
    return null;
  }

  return created as UserProfile;
}

export async function upsertMyProfile(updates: {
  name?: string | null;
  phone_number?: string | null;
  avatar_id?: string | null;
}): Promise<UserProfile> {
  const user = await getAuthUserOrNull();
  if (!user) throw new AuthRequiredError();

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        ...updates,
      },
      { onConflict: "id" }
    )
    .select("id, name, email, phone_number, avatar_id, created_at")
    .single();

  if (error || !data) {
    console.error("Error upserting profile:", error);
    throw new Error(error?.message || "Failed to update profile.");
  }

  return data as UserProfile;
}

export function isProfileComplete(profile: UserProfile | null | undefined): boolean {
  const nameOk = Boolean(profile?.name && profile.name.trim().length > 0);
  const phoneOk = Boolean(profile?.phone_number && String(profile.phone_number).trim().length > 0);
  return nameOk && phoneOk;
}

export async function requireUserAndCompletedProfile(): Promise<{ user: SupabaseAuthUser; profile: UserProfile }> {
  const user = await getAuthUserOrNull();
  if (!user) throw new AuthRequiredError();

  const profile = await getMyProfileOrNull();
  if (!profile || !isProfileComplete(profile)) {
    throw new ProfileIncompleteError();
  }

  return { user, profile };
}

export async function getAvatars(): Promise<{ id: string; url: string }[]> {
  // Preferred source: `public.avatars` table (id + public URL)
  const { data: rows, error: tableError } = await supabase
    .from("avatars")
    .select("id, url")
    .order("id", { ascending: true });

  if (!tableError && rows && rows.length > 0) {
    return rows as { id: string; url: string }[];
  }

  if (tableError) {
    console.error("Error fetching avatars table:", tableError);
  }

  // Fallback: storage list (useful if table is empty / RLS blocks it)
  const { data: files, error: storageError } = await supabase.storage.from("avatars").list("", {
    limit: 200,
    offset: 0,
    sortBy: { column: "name", order: "asc" },
  });

  if (storageError) {
    console.error("Error fetching avatars from storage:", storageError);
    return [];
  }

  return (files || [])
    .filter((f) => Boolean(f?.name) && !f.name.endsWith("/"))
    .map((file) => {
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(file.name);
      return { id: file.name, url: urlData.publicUrl };
    });
}

export async function getMyBookings(): Promise<Booking[]> {
  const user = await getAuthUserOrNull();
  if (!user) throw new AuthRequiredError();

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      service:services(*),
      company:companies(*),
      provider:providers(*)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching my bookings:", error);
    throw new Error(error.message);
  }
  return (data || []) as Booking[];
}

export async function getMyQueueEntries(): Promise<QueueItem[]> {
  const user = await getAuthUserOrNull();
  if (!user) throw new AuthRequiredError();

  const { data, error } = await supabase
    .from("queue_entries")
    .select(
      `
      *,
      service:services(
        *,
        company:companies(*)
      ),
      provider:providers(*)
    `
    )
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  if (error) {
    console.error("Error fetching my queue entries:", error);
    throw new Error(error.message);
  }
  return (data || []) as QueueItem[];
}

export async function leaveQueue(queueId: string | number): Promise<void> {
  const user = await getAuthUserOrNull();
  if (!user) throw new AuthRequiredError();

  const { error } = await supabase
    .from("queue_entries")
    .update({ status: "noshow" })
    .eq("id", queueId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error leaving queue:", error);
    throw new Error(error.message || "Failed to leave queue.");
  }

  // Also remove any provider reservations associated with this queue entry
  await supabase
    .from("provider_reservations")
    .delete()
    .eq("source_type", "queue")
    .eq("source_row_id", queueId);
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const user = await getAuthUserOrNull();
  if (!user) throw new AuthRequiredError();

  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error cancelling booking:", error);
    throw new Error(error.message || "Failed to cancel booking.");
  }

  // Release the reserved slot immediately so it becomes available for others
  await supabase
    .from("provider_reservations")
    .delete()
    .eq("source_type", "booking")
    .eq("source_row_id", bookingId);
}




  // The main function to create a new queue entry

 export type CreateQueuePayload = {

  // When authenticated, these are auto-filled from `profiles`.
  user_name?: string;

  phone_number?: string;

  service_id: string;

  provider_id: string | null; // Can be null if 'Any Provider' is chosen

  queue_type: 'walk-in' | 'booking' | 'walk_in';

  appointment_time?: string | null; 

  notes?: string | null; 

  service_variant_id?: string | null;

  original_price?: number | null;

  discount_amount?: number | null;

  final_price?: number | null;

  components?: QueueComponentInput[];

  selected_component_ids?: string[];

};

// Helper to check if a discount is currently active and not expired
export function isDiscountActive(
  discountType?: 'percentage' | 'fixed' | null,
  discountValue?: number | null,
  discountEndDate?: string | null
): boolean {
  if (!discountType || discountValue === null || discountValue === undefined || Number(discountValue) <= 0) {
    return false;
  }
  if (discountEndDate) {
    try {
      const end = new Date(discountEndDate);
      if (!isNaN(end.getTime()) && new Date() > end) return false;
    } catch {
      // ignore
    }
  }
  return true;
}

// Helper to calculate price breakdown for any service or variant item
export function calculateItemPriceBreakdown(item: {
  price: string | number | null;
  discount_type?: 'percentage' | 'fixed' | null;
  discount_value?: number | null;
  discount_end_date?: string | null;
  is_price_visible?: boolean | null;
  price_type?: 'fixed' | 'call_for_price';
}) {
  const isCallForPrice =
    item.price_type === 'call_for_price' ||
    item.is_price_visible === false ||
    item.price === null ||
    item.price === undefined ||
    item.price === '';

  if (isCallForPrice) {
    return {
      isCallForPrice: true,
      originalPrice: null as number | null,
      discountAmount: 0,
      finalPrice: null as number | null,
      hasDiscount: false,
      discountLabel: '',
    };
  }

  const originalPrice =
    typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0;

  const activeDiscount = isDiscountActive(
    item.discount_type,
    item.discount_value,
    item.discount_end_date
  );

  let discountAmount = 0;
  let discountLabel = '';
  if (activeDiscount && item.discount_value) {
    if (item.discount_type === 'percentage') {
      discountAmount = (originalPrice * Number(item.discount_value)) / 100;
      discountLabel = `${Math.round(Number(item.discount_value))}% off`;
    } else if (item.discount_type === 'fixed') {
      discountAmount = Math.min(originalPrice, Number(item.discount_value));
      discountLabel = `Save ${Number(item.discount_value)} ETB`;
    }
  }

  const finalPrice = Math.max(0, originalPrice - discountAmount);

  return {
    isCallForPrice: false,
    originalPrice,
    discountAmount,
    finalPrice,
    hasDiscount: discountAmount > 0,
    discountLabel,
  };
}

// Helper to calculate starting price for multi-variant or single service
export function calculateServiceStartingPrice(service: Service): {
  isCallForPrice: boolean;
  minPrice: number | null;
  originalPrice: number | null;
  hasDiscount: boolean;
  minVariant?: ServiceVariant | null;
} {
  if (service.is_price_visible === false) {
    return { isCallForPrice: true, minPrice: null, originalPrice: null, hasDiscount: false };
  }

  if (service.has_variants && service.service_variants && service.service_variants.length > 0) {
    const activeVariants = service.service_variants.filter((v) => v.is_active !== false);
    if (activeVariants.length === 0) {
      return { isCallForPrice: true, minPrice: null, originalPrice: null, hasDiscount: false };
    }

    let lowestFinalPrice: number | null = null;
    let lowestVariant: ServiceVariant | null = null;
    let lowestOriginalPrice: number | null = null;
    let lowestHasDiscount = false;

    for (const variant of activeVariants) {
      const breakdown = calculateItemPriceBreakdown(variant);
      if (!breakdown.isCallForPrice && breakdown.finalPrice !== null) {
        if (lowestFinalPrice === null || breakdown.finalPrice < lowestFinalPrice) {
          lowestFinalPrice = breakdown.finalPrice;
          lowestVariant = variant;
          lowestOriginalPrice = breakdown.originalPrice;
          lowestHasDiscount = breakdown.hasDiscount;
        }
      }
    }

    if (lowestFinalPrice !== null) {
      return {
        isCallForPrice: false,
        minPrice: lowestFinalPrice,
        originalPrice: lowestOriginalPrice,
        hasDiscount: lowestHasDiscount,
        minVariant: lowestVariant,
      };
    } else {
      return { isCallForPrice: true, minPrice: null, originalPrice: null, hasDiscount: false };
    }
  }

  const baseBreakdown = calculateItemPriceBreakdown(service);
  return {
    isCallForPrice: baseBreakdown.isCallForPrice,
    minPrice: baseBreakdown.finalPrice,
    originalPrice: baseBreakdown.originalPrice,
    hasDiscount: baseBreakdown.hasDiscount,
  };
}

// --- COMPONENT PRICING & DURATION CALCULATIONS ---

/**
 * Calculates the total additional cost for selected components.
 * Only separately charged components (is_included === false) contribute to the extra cost.
 * Included components (is_included === true) are never charged twice.
 */
export function calculateBookingComponentsTotal(
  components: Array<{
    price_at_booking?: number;
    price?: number;
    quantity?: number;
    is_included?: boolean;
  }>
): number {
  if (!components || components.length === 0) return 0;
  const sum = components.reduce((acc, c) => {
    if (c.is_included) return acc; // Included components are $0 additional
    const qty = Math.max(1, Number(c.quantity) || 1);
    const p = Math.max(0, Number(c.price_at_booking ?? c.price) || 0);
    return acc + p * qty;
  }, 0);
  return Math.round(sum * 100) / 100;
}

/**
 * Calculates total elapsed service duration taking overlappable components into account.
 * Overlappable steps (is_overlappable === true) run concurrently with other treatments
 * and do not add sequential minutes to the client's elapsed appointment time.
 */
export function calculateTotalServiceDurationWithComponents(
  baseDurationMins: number,
  components: Array<{ duration_mins?: number; is_overlappable?: boolean }>
): number {
  const base = Math.max(0, Number(baseDurationMins) || 0);
  if (!components || components.length === 0) return base;

  // Add sequential (non-overlappable) component durations
  const addOnsDuration = components.reduce((acc, c) => {
    if (c.is_overlappable) return acc;
    return acc + Math.max(0, Number(c.duration_mins) || 0);
  }, 0);

  return base + addOnsDuration;
}

/**
 * Calculates total workload minutes across all components (sequential + overlappable)
 * for provider capacity and staff scheduling metrics.
 */
export function calculateTotalWorkloadDuration(
  baseDurationMins: number,
  components: Array<{ duration_mins?: number }>
): number {
  const base = Math.max(0, Number(baseDurationMins) || 0);
  if (!components || components.length === 0) return base;
  const total = components.reduce((acc, c) => acc + Math.max(0, Number(c.duration_mins) || 0), base);
  return total;
}

/**
 * Unified calculation function across service details, cart, and checkout.
 * Accurately combines main service/variant pricing with selected add-ons and discounts.
 */
export function calculateServiceWithComponentsPriceBreakdown(
  service: Service,
  selectedVariant?: ServiceVariant | null,
  selectedComponents: ServiceComponent[] = []
): {
  priceBreakdown: PriceBreakdown;
  durationMins: number;
  totalWorkloadMins: number;
} {
  const targetItem = selectedVariant || service;
  const baseBreakdown = calculateItemPriceBreakdown(targetItem);

  const baseDuration = selectedVariant?.duration_mins || service.estimated_wait_time_mins || 30;
  const sequentialDuration = calculateTotalServiceDurationWithComponents(baseDuration, selectedComponents);
  const totalWorkload = calculateTotalWorkloadDuration(baseDuration, selectedComponents);

  if (baseBreakdown.isCallForPrice) {
    return {
      priceBreakdown: {
        basePrice: 0,
        addonsPrice: 0,
        originalPrice: 0,
        discountAmount: 0,
        finalPrice: 0,
        hasDiscount: false,
        discountLabel: null,
        isCallForPrice: true,
      },
      durationMins: sequentialDuration,
      totalWorkloadMins: totalWorkload,
    };
  }

  const addonsPrice = calculateBookingComponentsTotal(selectedComponents);
  const baseOriginal = baseBreakdown.originalPrice || 0;
  const baseFinal = baseBreakdown.finalPrice || 0;

  const originalPrice = baseOriginal + addonsPrice;
  const finalPrice = Math.max(0, baseFinal + addonsPrice);

  return {
    priceBreakdown: {
      basePrice: baseFinal,
      addonsPrice,
      originalPrice,
      discountAmount: baseBreakdown.discountAmount || 0,
      finalPrice,
      hasDiscount: baseBreakdown.hasDiscount,
      discountLabel: baseBreakdown.discountLabel || null,
      isCallForPrice: false,
    },
    durationMins: sequentialDuration,
    totalWorkloadMins: totalWorkload,
  };
}

/**
 * Validates whether a component belongs to the specified service.
 */
export function validateComponentBelongsToService(
  component: { service_id: string },
  serviceId: string
): boolean {
  return Boolean(component && component.service_id === serviceId);
}

const mapToProvider = (providerData: any): Provider => ({

    id: providerData.id,

    name: providerData.name,

    specialization: providerData.specialization || null,

    is_active: providerData.is_active,

    created_at: providerData.created_at, 

    company_id: providerData.company_id, // Ensure this column exists in your providers table

});

export const mapToServiceVariant = (data: any): ServiceVariant => ({
  id: data.id,
  service_id: data.service_id,
  name: data.name || '',
  duration_mins: data.duration_mins !== undefined && data.duration_mins !== null ? Number(data.duration_mins) : null,
  price: data.price !== undefined && data.price !== null ? String(data.price) : null,
  price_type: data.price_type || 'fixed',
  discount_type: data.discount_type || null,
  discount_value: data.discount_value !== undefined && data.discount_value !== null ? Number(data.discount_value) : null,
  discount_end_date: data.discount_end_date || null,
  is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
  created_at: data.created_at,
  updated_at: data.updated_at,
});

export const mapToServiceComponent = (data: any): ServiceComponent => ({
  id: data.id,
  service_id: data.service_id,
  name: data.name || '',
  component_type: data.component_type === 'phase' ? 'phase' : 'addon',
  description: data.description || null,
  price: Number(data.price) || 0,
  duration_mins: Number(data.duration_mins) || 0,
  is_required: Boolean(data.is_required),
  is_included: Boolean(data.is_included),
  is_overlappable: Boolean(data.is_overlappable),
  display_order: Number(data.display_order) || 0,
  is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
  created_at: data.created_at,
  updated_at: data.updated_at,
});

// Helper to convert database rows to our Service type

const mapToService = (serviceData: any): Service => {
  let parsedIncludedIds: string[] = [];
  if (serviceData.included_service_ids) {
    if (Array.isArray(serviceData.included_service_ids)) {
      parsedIncludedIds = serviceData.included_service_ids;
    } else if (typeof serviceData.included_service_ids === 'string') {
      try {
        const parsed = JSON.parse(serviceData.included_service_ids);
        if (Array.isArray(parsed)) parsedIncludedIds = parsed;
      } catch {
        parsedIncludedIds = [];
      }
    }
  }

  let descriptionPoints: string[] = [];
  if (serviceData.description_points) {
    if (Array.isArray(serviceData.description_points)) {
      descriptionPoints = serviceData.description_points;
    } else if (typeof serviceData.description_points === 'string') {
      try {
        const parsed = JSON.parse(serviceData.description_points);
        if (Array.isArray(parsed)) descriptionPoints = parsed;
        else descriptionPoints = [serviceData.description_points];
      } catch {
        descriptionPoints = [serviceData.description_points];
      }
    }
  }

  const rawComps = serviceData.service_components || serviceData.components || [];
  const mappedComps = Array.isArray(rawComps) ? rawComps.map(mapToServiceComponent) : [];

  return {
    id: serviceData.id,
    company_id: serviceData.company_id,
    name: serviceData.name,
    category_id: serviceData.category_id || null,
    description: serviceData.description || null,
    estimated_wait_time_mins: serviceData.estimated_wait_time_mins || null,
    status: serviceData.status,
    code: serviceData.code || null,
    created_at: serviceData.created_at, 
    price: serviceData.price !== null && serviceData.price !== undefined ? String(serviceData.price) : null,
    photo: serviceData.photo || null,
    featureEnabled: serviceData.featureEnabled === true,
    discount_type: serviceData.discount_type,
    discount_value: serviceData.discount_value,
    discount_end_date: serviceData.discount_end_date || null,
    requires_prepayment: serviceData.requires_prepayment || false,
    prepayment_amount: serviceData.prepayment_amount || null,
    is_package: Boolean(serviceData.is_package),
    included_service_ids: parsedIncludedIds,
    video_url: serviceData.video_url || null,
    video_platform: serviceData.video_platform || null,
    is_price_visible: serviceData.is_price_visible !== undefined ? Boolean(serviceData.is_price_visible) : true,
    has_variants: Boolean(serviceData.has_variants),
    description_points: descriptionPoints,
    service_variants: serviceData.service_variants ? serviceData.service_variants.map(mapToServiceVariant) : [],
    package_items: serviceData.package_items || [],
    components: mappedComps,
    service_components: mappedComps,
  };
};



// Helper to convert database rows to our Company type

const mapToCompany = (companyData: any): Company => ({

    id: companyData.id,

    name: companyData.name,

    slug: companyData.slug,

    phone: companyData.phone || null,

    email: companyData.email || null,

    address: companyData.address || null,

    working_hours: companyData.working_hours || null,

    logo: companyData.logo || null,

    location_text: companyData.location_text || null,

    location_link: companyData.location_link || null,

    owner_uid: companyData.owner_uid,

    created_at: companyData.created_at || null, 

    socials: companyData.socials || null,

    bank_accounts: Array.isArray(companyData.bank_accounts) ? companyData.bank_accounts : [],

    bank_name: companyData.bank_name || null,

    account_name: companyData.account_name || null,

    account_number: companyData.account_number || null,

});



// ===== LOCATIONS =====

export const getLocations = async (): Promise<Location[]> => {

  try {

    const { data, error } = await supabase

      .from('global_locations')

      .select('*');



    if (error) {

      console.error('Error getting locations:', error);

      return [];

    }

    return data || [];

  } catch (error) {

    console.error('Error getting locations:', error);

    return [];

  }

};



// ===== CATEGORIES =====

export const getAllCategories = async (): Promise<Category[]> => {

  try {

    const { data, error } = await supabase

      .from('service_categories')

      .select('*')

      .order('name', { ascending: true });



    if (error) {

      console.error('Error getting categories:', error);

      return [];

    }

    return data || [];

  } catch (error) {

    console.error('Error getting categories:', error);

    return [];

  }

};



export const getHierarchicalCategories = async (): Promise<Category[]> => {

  try {

    const { data, error } = await supabase

      .from('service_categories')

      .select('*')

      .order('name', { ascending: true });



    if (error) {

      console.error('Error getting hierarchical categories:', error);

      return [];

    }



    // Build hierarchical structure

    const categories = data || [];

    const categoryMap = new Map<string, Category>();

    const rootCategories: Category[] = [];



    // First pass: create map and identify root categories

    categories.forEach(category => {

      categoryMap.set(category.id, category);

      if (!category.parent_category_id) {

        rootCategories.push(category);

      }

    });



    // Second pass: build hierarchy

    const buildHierarchy = (parent: Category): Category[] => {

      const children = categories

        .filter(cat => cat.parent_category_id === parent.id)

        .map(child => ({ ...child, children: buildHierarchy(child) }));

      

      return children.length > 0 ? children : [];

    };



    return rootCategories.map(root => ({

      ...root,

      children: buildHierarchy(root)

    }));

  } catch (error) {

    console.error('Error getting hierarchical categories:', error);

    return [];

  }

};



export const getCategoryById = async (id: string): Promise<Category | null> => {

  try {

    const { data, error } = await supabase

      .from('service_categories')

      .select('*')

      .eq('id', id)

      .single();



    if (error) {

      console.error('Error getting category by ID:', error);

      return null;

    }

    return data;

  } catch (error) {

    console.error('Error getting category by ID:', error);

    return null;

  }

};



// ===== COMPANY TYPES =====

export const getAllCompanyTypes = async (): Promise<CompanyType[]> => {

  try {

    const { data, error } = await supabase

      .from('company_types')

      .select('*')

      .order('name', { ascending: true });



    if (error) {

      console.error('Error getting company types:', error);

      return [];

    }

    return data || [];

  } catch (error) {

    console.error('Error getting company types:', error);

    return [];

  }

};



export const getCompanyTypeOptions = async (): Promise<LocationOption[]> => {

  try {

    const companyTypes = await getAllCompanyTypes();

    return companyTypes.map((companyType) => ({

      id: companyType.id,

      value: companyType.id,

      label: companyType.name,

    }));

  } catch (error) {

    console.error("Error getting company type options:", error);

    return [];

  }

};



// Get categories that are available for selected company types

export const getCategoriesByCompanyTypes = async (companyTypeIds: string[]): Promise<Category[]> => {

  try {

    if (companyTypeIds.length === 0) {

      // If no company types selected, return all categories

      return await getAllCategories();

    }



    const { data, error } = await supabase

      .from('service_categories')

      .select(`

        service_category_id,

        service_categories (

          *

        )

      `)

      .in('company_type_id', companyTypeIds);



    if (error) {

      console.error('Error getting categories by company types:', error);

      return [];

    }



    // Extract unique categories

    const categoryMap = new Map<string, Category>();

    (data || []).forEach((item: any) => {

      if (item.service_categories) {

        categoryMap.set(item.service_categories.id, item.service_categories);

      }

    });



    return Array.from(categoryMap.values());

  } catch (error) {

    console.error('Error getting categories by company types:', error);

    return [];

  }

};



// ===== SERVICES =====

export const getServiceWithProviders = async (

  companyId: string, 

  serviceId: string

): Promise<Service | null> => {

  try {

    const { data: service, error } = await supabase

      .from('services')

      .select(`

        *,

        service_providers (

          providers (*)

        )

      `)

      .eq('id', serviceId)

      .eq('company_id', companyId)

      .eq('status', 'active')

      .single();



    if (error) {

      console.error('Error getting service with providers:', error?.message);

      return null;

    }



    if (!service) return null;



    const providers = service.service_providers

      ? service.service_providers

          .map((sp: any) => mapToProvider(sp.providers))

          .filter(Boolean) as Provider[]

      : [];



    const mappedService = mapToService(service);



    return {

      ...mappedService,

      providers: providers,

    } as Service;

  } catch (error) {

    console.error('Error getting service with providers:', error);

    return null;

  }

};





export const getAllServices = async (): Promise<Service[]> => {

    try {

      const { data, error } = await supabase

        .from('services')

        .select(`

          *,

          company:companies (

            id,

            name,

            location_text

          ),

          service_providers (

            providers ( * )

          ),

          service_photos ( url )

        `)

        .eq('status', 'active');

  

      if (error) {

        console.error('Error fetching all services:', error);

        throw error; // It's better to throw the error to be handled by the caller

      }

  

      if (!data) {

        return [];

      }

  

      // --- THE FIX ---

      // Instead of a complex map, we just clean up the nested providers.

      // The rest of the data is already in the correct shape thanks to the query.

      const servicesWithProviders = data.map((service: any) => {

        const providers = service.service_providers

          ? service.service_providers.map((sp: any) => sp.providers).filter(Boolean)

          : [];

        

        // Map first service photo url to photo field for uniform consumption

        const photoUrl = service.service_photos?.[0]?.url || service.photo || null;



        // We can delete the temporary join table data if we want a clean object

        delete service.service_providers;

        if (service.service_photos) delete service.service_photos;

  

        return {

          ...mapToService(service),

          photo: photoUrl,

          providers: providers,

          company: service.company,

        };

      });

  

      const result = servicesWithProviders as Service[];
      await enrichServicesWithCategories(result);
      await enrichServicesWithCompanyRatings(result);
      await enrichServicesWithVariants(result);
      await enrichServicesWithComponents(result);
      await enrichPackagesWithInclusions(result);

      return result;

  

    } catch (error) {

      console.error('Error in getAllServices function:', error);

      return []; // Return empty array on failure

    }

  };

export const getTopRatedServices = async (limit: number = 9): Promise<Service[]> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        company:companies (
          id,
          name,
          location_text
        ),
        service_providers (
          providers ( * )
        ),
        service_photos ( url )
      `)
      .eq('status', 'active')
      .or('is_package.is.null,is_package.eq.false')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching top rated services:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const servicesWithProviders = data.map((service: any) => {
      const providers = service.service_providers
        ? service.service_providers.map((sp: any) => sp.providers).filter(Boolean)
        : [];
      const photoUrl = service.service_photos?.[0]?.url || service.photo || null;

      delete service.service_providers;
      if (service.service_photos) delete service.service_photos;

      return {
        ...mapToService(service),
        photo: photoUrl,
        providers: providers,
        company: service.company,
      };
    });

    const result = servicesWithProviders as Service[];
    await enrichServicesWithCategories(result);
    await enrichServicesWithCompanyRatings(result);
    await enrichServicesWithVariants(result);
    await enrichServicesWithComponents(result);

    return result;
  } catch (error) {
    console.error('Error in getTopRatedServices function:', error);
    return [];
  }
};

export const getAllServicesByCategory = async (categoryId: string): Promise<Service[]> => {

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



export const getGlobalCategoriesWithServiceCounts = async (): Promise<Category[]> => {

  try {

    const { data: categories, error: categoriesError } = await supabase

      .from('service_categories')

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



// ===== SEARCH FUNCTIONS =====

export const searchServices = async (searchTerm: string, categoryId?: string): Promise<Service[]> => {

  try {

    let query = supabase

      .from('services')

      .select(`

        *,

        companies (*)

      `)

      .eq('status', 'active');



    if (categoryId) {

      query = query.eq('category_id', categoryId);

    }



    const { data, error } = await query;



    if (error) {

      console.error('Error searching services:', error);

      return [];

    }



    const services = (data || []).map((service: any) => ({

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

      company: service.companies

    })) as Service[];



    // Filter by search term

    const q = searchTerm.trim().toLowerCase();

    const tokens = q.split(/\s+/).filter(Boolean);

    if (tokens.length === 0) return services;



    const matches = (text?: string) =>

      text ? tokens.some(t => text.toLowerCase().includes(t)) : false;



    return services.filter(service =>

      matches(service.name) ||

      matches(service.code) ||

      matches((service as any).company?.name) ||

      matches(service.description)

    );

  } catch (error) {

    console.error('Error searching services:', error);

    return [];

  }

};



// Featured services: status active AND featureEnabled true

export async function getDiscountedServices(limit: number = 12): Promise<Service[]> {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        company:companies (
          id,
          name,
          location_text
        ),
        service_photos (
          url
        )
      `)
      .eq('status', 'active')
      .or('is_package.is.null,is_package.eq.false')
      .not('discount_type', 'is', null) // Ensure there is a discount
      .not('discount_value', 'is', null)
      .limit(limit);

    if (error) {
      console.error("Error fetching discounted services:", error);
      return [];
    }

    const services: Service[] = (data || [])
      .filter((raw: any) => !raw.is_package)
      .map((raw: any) => ({
        ...mapToService(raw),
        company: raw.company,
        service_photos: raw.service_photos || [],
        photo: raw.service_photos?.[0]?.url || raw.photo || null,
      }));

    await enrichServicesWithCategories(services);
    await enrichServicesWithCompanyRatings(services);
    await enrichServicesWithVariants(services);
    await enrichServicesWithComponents(services);

    return services;
  } catch (error) {
    console.error("Error in getDiscountedServices function:", error);
    return [];
  }
}

// Global stats for the landing page

export const getGlobalStats = async (): Promise<GlobalStatsData> => {

  try {

    const [companiesResult, servicesResult, completedResult, usersResult] = await Promise.all([

      supabase.from('companies').select('id', { count: 'exact', head: true }),

      supabase.from('services').select('id', { count: 'exact', head: true }).eq('status', 'active'),

      supabase.from('queue_entries').select('id', { count: 'exact', head: true }).eq('status', 'served'),

      supabase.from('users').select('id', { count: 'exact', head: true })

    ]);



    return {

      companiesCount: companiesResult.count || 0,

      activeServicesCount: servicesResult.count || 0,

      servicesCompletedCount: completedResult.count || 0,

      usersCount: usersResult.count || 0,

    };

  } catch (error) {

    console.error('Error getting global stats:', error);

    return { 

      companiesCount: 0, 

      activeServicesCount: 0, 

      servicesCompletedCount: 0, 

      usersCount: 0 

    };

  }

};



// ===== COMPANIES =====

export const getAllCompanies = async (): Promise<Company[]> => {

  try {

    // This query now joins with the company_types table

    // through your join table (which Supabase handles automatically

    // if relationships are set up correctly).

    const { data, error } = await supabase

      .from('companies')

      .select(`
        *,
        company_types (*),
        company_photos (*),
        services (id, name, price, photo, status)
      `);

    if (error) {
      console.error('Error getting all companies with types:', error?.message);
      const { data: fallbackData } = await supabase
        .from('companies')
        .select(`
          *,
          company_types (*)
        `);
      return (fallbackData || []) as Company[];
    }



    // No mapping needed if the query returns the shape we want

    const companies = (data || []) as Company[];
    await enrichCompaniesWithRatings(companies);
    return companies; 

  } catch (error) {

    console.error('Error in getAllCompanies function:', error);

    return [];

  }

};



export const getCompanyOptions = async (): Promise<LocationOption[]> => {

  try {

    const companies = await getAllCompanies();

    return companies.map((company) => ({

      id: company.id,

      value: company.id,

      label: company.name,

    }));

  } catch (error) {

    console.error("Error getting company options:", error);

    return [];

  }

};



// In your user-facing API file (e.g., src/lib/supabase-utils.ts)



/**

 * Fetches a single service with ALL its related data (company and providers).

 * This version fetches all providers, regardless of their active status.

 */

// In your user-facing API file (e.g., src/lib/supabase-utils.ts)





/**

 * Fetches a single service with ALL its related data (company and providers).

 * This version fetches all providers, regardless of their active status.

 */

  export const getServiceDetails = async (serviceId: string): Promise<Service | null> => {

  try {

    const { data, error } = await supabase

      .from('services')

      .select(`

        *,

        company:companies (*),

        service_providers (

          providers (*)

        ),

        service_photos (

          url

        )

      `) // <-- CORRECTED QUERY STRUCTURE

      .eq('id', serviceId)

      .eq('status', 'active')

      .single();



    if (error) {

      if (error.code === 'PGRST116') { // This code means .single() found no rows

        console.log(`No active service found with ID: ${serviceId}`);

        return null;

      }

      console.error("Supabase query error in getServiceDetails:", error);

      throw error;

    }



    if (!data) {

      return null;

    }



    // --- CORRECTED DATA PROCESSING ---



    // 1. Cast the raw data for easier access

    const rawServiceData = data as any;



    // 2. Extract and map providers

    const providers: Provider[] = rawServiceData.service_providers

      ? rawServiceData.service_providers

          .map((sp: any) => sp.providers ? mapToProvider(sp.providers) : null)

          .filter(Boolean) // Remove any nulls if a provider relation was missing

      : [];



    // 3. Extract and map the company

    const company = rawServiceData.company ? mapToCompany(rawServiceData.company) : undefined;

    

    // 4. Extract the photo URL

    let publicPhotoUrl: string | null = null;

    if (rawServiceData.service_photos && rawServiceData.service_photos.length > 0) {

      publicPhotoUrl = rawServiceData.service_photos[0].url;

    }



    // 5. Construct the base Service object
    const service: Service = {
      ...mapToService(rawServiceData), // Map the base service properties
      photo: publicPhotoUrl,           // Add the processed photo URL
      service_photos: rawServiceData.service_photos || [], // Keep all photos for carousels/galleries
      providers: providers,            // Add the mapped providers
      company: company,                // Add the mapped company
    };

    // 6. Fetch included services & company specialists if this is a package
    if (service.is_package) {
      if (Array.isArray(service.included_service_ids) && service.included_service_ids.length > 0) {
        try {
          const { data: subServicesData, error: subError } = await supabase
            .from('services')
            .select('*, service_photos(url)')
            .in('id', service.included_service_ids);

          if (!subError && subServicesData) {
            service.included_services = subServicesData.map((sub: any) => ({
              ...mapToService(sub),
              photo: sub.service_photos && sub.service_photos.length > 0 ? sub.service_photos[0].url : sub.photo,
            }));

            // If package wait time isn't explicitly set, sum the included services wait times
            if (!service.estimated_wait_time_mins || service.estimated_wait_time_mins <= 0) {
              const totalMins = service.included_services.reduce(
                (sum, s) => sum + (s.estimated_wait_time_mins || 0),
                0
              );
              if (totalMins > 0) {
                service.estimated_wait_time_mins = totalMins;
              }
            }
          }
        } catch (subErr) {
          console.error("Error fetching included services for package:", subErr);
        }
      }

      // If package doesn't have providers directly attached, pull active providers from the company
      if ((!service.providers || service.providers.length === 0) && service.company_id) {
        try {
          const { data: companyProviders, error: cpErr } = await supabase
            .from('providers')
            .select('*')
            .eq('company_id', service.company_id)
            .eq('is_active', true);

          if (!cpErr && companyProviders && companyProviders.length > 0) {
            service.providers = companyProviders.map((p: any) => mapToProvider(p));
          }
        } catch (cpErr) {
          console.error("Error fetching company providers for package:", cpErr);
        }
      }
    }

    await enrichServicesWithCategories([service]);
    await enrichServicesWithVariants([service]);
    await enrichServicesWithComponents([service]);
    await enrichPackagesWithInclusions([service]);
    if (service.company && !service.company.rating_summary) {
      await enrichCompaniesWithRatings([service.company]);
    }

    return service;



  } catch (error) {

    console.error(`Error fetching service details for ID ${serviceId}:`, error);

    return null;

  }

};



const findOrCreateUser = async (phoneNumber: string, name: string): Promise<{ id: string }> => {

    // 1. Check if user exists

    let { data: existingUser } = await supabase

      .from('users')

      .select('id')

      .eq('phone_number', phoneNumber)

      .single();

  

    if (existingUser) {

      return existingUser;

    }

  

    // 2. If not, create them

    const { data: newUser, error } = await supabase

      .from('users')

      .insert({ phone_number: phoneNumber, name: name })

      .select('id')

      .single();

  

    if (error || !newUser) {

      throw new Error('Could not create user.');

    }

    

    return newUser;

  };

  

  





// In your Supabase utility file (e.g., src/lib/supabase-utils.ts)



// In your Supabase utility file (e.g., src/lib/supabase-utils.ts)



export const createQueueEntry = async (payload: CreateQueuePayload): Promise<QueueItem & {position: number}> => {

  try {

    // Only calculate position for 'walk-in' queues

    // For 'booking' queues, position might be less relevant or handled differently later

    const safeQueueType = (payload.queue_type === 'walk_in' || payload.queue_type === 'walk-in' || !payload.queue_type) ? 'walk-in' : payload.queue_type;
    const currentQueueCount = safeQueueType === 'walk-in' ? await getCurrentQueueCount(payload.service_id) : 0;
    const position = currentQueueCount + 1;

    const { data, error } = await supabase
      .from('queue_entries')
      .insert({
        service_id: payload.service_id,
        provider_id: payload.provider_id, // This can now be null
        user_name: payload.user_name,
        phone_number: payload.phone_number,
        queue_type: safeQueueType,
        status: 'waiting', // Default status for new entries

        appointment_time: payload.appointment_time,

        notes: payload.notes,

        // The `joined_at` column in your DB should have a `DEFAULT NOW()`

        // Supabase will automatically populate `created_at` which we can map to `joined_at`

      })

      .select()

      .single();



    if (error) {

      console.error('Error creating queue entry:', error);

      throw new Error(`Failed to join queue: ${error.message}`);

    }



    if (!data) {

        throw new Error('Failed to retrieve new queue entry after creation.');

    }



    const queueItem: QueueItem = {

        id: data.id,

        service_id: data.service_id,

        provider_id: data.provider_id || null,

        user_id: data.user_uid || null, // Assuming user_uid might be null from the DB for walk-ins

        user_name: data.user_name,

        phone_number: data.phone_number,

        status: data.status,

        queue_type: data.queue_type,

        notes: data.notes || null,

        joined_at: data.created_at,

        served_at:data.served_at,

        position:data.position, // Use created_at from Supabase for joined_at

    };



    return { ...queueItem, position }; 



  } catch (error) {

    console.error('Error in createQueueEntry function:', error);

    throw error;

  }

};

  //featured services

  export const getFeaturedServices = async (): Promise<Service[]> => {

    try {

      const { data, error } = await supabase

        .from('services')

        .select(`

          *,

        company:companies ( name, id , slug),

        service_photos ( url ) 

        `)

        .eq('status', 'active')

        .eq('featureEnabled', true); // Assumes column name is `featureEnabled`

  

      if (error) {

        console.error("Error fetching featured services:", error);

        throw error;

      }

  

    // Normalize photo field

    const normalized = (data || []).map((svc: any) => ({

      ...svc,

      photo: svc.service_photos?.[0]?.url || svc.photo || null,

      service_photos: undefined,

    }));



    return normalized as Service[];

    } catch (error) {

      console.error("Error in getFeaturedServices function:", error);

      return [];

    }

  };





//services with category 

export const getCategoryWithServices = async (categoryId: string): Promise<CategoryWithServices | null> => {

  try {

    // First, get the category

    const { data: categoryData, error: categoryError } = await supabase

      .from('service_categories')

      .select('*')

      .eq('id', categoryId)

      .single();



    if (categoryError) {

      if (categoryError.code === 'PGRST116') {

        console.log(`No category found with ID: ${categoryId}`);

        return null;

      }

      console.error("Supabase category query error:", categoryError);

      throw categoryError;

    }



    // Then, get the services for this category

    const { data: servicesData, error: servicesError } = await supabase

      .from('services')

      .select(`

        *,

        company:companies ( name, id )

      `)

      .eq('category_id', categoryId)

      .eq('status', 'active');



    if (servicesError) {

      console.error("Supabase services query error:", servicesError);

      throw servicesError;

    }



    // Combine the data

    const result: CategoryWithServices = {

      ...categoryData,

      services: servicesData || []

    };

    

    return result;



  } catch (error) {

    console.error("Error fetching category with services:", error);

    return null;

  }

};







export const getCurrentQueueCount = async (serviceId: string, providerId?: string): Promise<number> => {
  try {
    if (providerId && providerId !== 'ANY_PROVIDER' && providerId !== ANY_PROVIDER_ID) {
      const { count, error } = await supabase
        .from('queue_entries')
        .select('*', { count: 'exact', head: true })
        .eq('service_id', serviceId)
        .eq('provider_id', providerId)
        .eq('status', 'waiting');

      if (error) {
        console.error('Error getting queue count:', error);
        return 0;
      }
      return count || 0;
    }

    // For ANY_PROVIDER or service overall: find the least queue among active service providers
    const { data: spData } = await supabase
      .from('service_providers')
      .select('provider_id')
      .eq('service_id', serviceId);

    const providerIds = (spData || []).map((sp: any) => sp.provider_id).filter(Boolean);

    if (providerIds.length === 0) {
      const { count } = await supabase
        .from('queue_entries')
        .select('*', { count: 'exact', head: true })
        .eq('service_id', serviceId)
        .eq('status', 'waiting');
      return count || 0;
    }

    if (providerIds.length === 1) {
      const { count } = await supabase
        .from('queue_entries')
        .select('*', { count: 'exact', head: true })
        .eq('service_id', serviceId)
        .eq('provider_id', providerIds[0])
        .eq('status', 'waiting');
      return count || 0;
    }

    // Multiple providers: calculate minimum queue length
    const counts = await Promise.all(
      providerIds.map(async (pid: string) => {
        const { count } = await supabase
          .from('queue_entries')
          .select('*', { count: 'exact', head: true })
          .eq('service_id', serviceId)
          .eq('provider_id', pid)
          .eq('status', 'waiting');
        return count || 0;
      })
    );

    return Math.min(...counts);
  } catch (error) {
    console.error('Error in getCurrentQueueCount function:', error);
    return 0;
  }
};





 

 // <--- CORRECTED BUCKET NAME



export async function getCompanyWithServices(companyId: string): Promise<Company | null> {

  const { data: companyData, error } = await supabase

    .from('companies')

    .select(`
      *,
      company_photos (
        id,
        url,
        type,
        created_at
      ),
      services (
        *,
        service_photos (
          url
        )
      )
    `)

    .eq('id', companyId)

    .single();



  if (error) {

    console.error("Error fetching company with services:", error.message);

    return null;

  }



  if (!companyData) {

    return null;

  }



  const servicesWithPhotoUrls = companyData.services?.map((service: any) => {

    let publicPhotoUrl = null;



    if (service.service_photos && service.service_photos.length > 0) {

      // Get the URL stored in the database

      const dbUrl = service.service_photos[0].url;



      // --- THIS IS THE FIX ---

      // Since the full URL is already in the database, we just use it directly.

      // We DO NOT call getPublicUrl() again.

      publicPhotoUrl = dbUrl;

    }



    return {

      ...service,

      photo: publicPhotoUrl,

      service_photos: undefined,

    };

  });



  return {

    ...companyData,

    services: servicesWithPhotoUrls,

  };

}



export async function getCompanyBySlugWithServices(companySlug: string): Promise<Company | null> {
  const cleanSlug = (() => {
    const trimmed = (companySlug ?? "").trim().replace(/^\/+|\/+$/g, "");
    try {
      return decodeURIComponent(trimmed);
    } catch {
      return trimmed;
    }
  })();

  if (!cleanSlug) return null;

  const companySelect = `
      *,
      company_photos (
        id,
        url,
        type,
        created_at
      ),
      company_company_types (
        company_types (
          id,
          name,
          icon,
          company_type_service_category_mapping (
            service_category_id
          )
        )
      ),
      services (
        *,
        service_photos (
          url
        )
      )
    `;

  let { data, error } = await supabase
    .from('companies')
    .select(companySelect)
    .eq('slug', cleanSlug)
    .maybeSingle();

  if (!data && !error) {
    ({ data, error } = await supabase
      .from('companies')
      .select(companySelect)
      .eq('id', cleanSlug)
      .maybeSingle());
  }

  if (error) {
    console.error('Error fetching company by slug:', error);
    return null;
  }

  if (!data) return null;

  if (data.services && Array.isArray(data.services)) {
    await enrichServicesWithCategories(data.services);
  }

  // Fetch rating summary from the view we created
  const { data: ratingSummary } = await supabase
    .from('company_rating_summary')
    .select('average_stars, total_ratings')
    .eq('company_id', data.id)
    .maybeSingle();

  const companyTypes = data.company_company_types?.map((item: any) => {
    const type = item.company_types;
    return {
      id: type.id,
      name: type.name,
      icon: type.icon,
      allowedCategoryIds: type.company_type_service_category_mapping?.map(
        (m: any) => m.service_category_id
      ) || []
    };
  }) || [];

  return {
    ...data,
    company_types: companyTypes,
    // Attach rating summary — null if no ratings yet
    rating_summary: ratingSummary ?? null,
  } as unknown as Company;
}


export async function getCompanyLocationOptions(): Promise<LocationOption[]> {

  // Fetch all location_text values (potentially with duplicates)

  const { data, error } = await supabase

    .from('companies')

    .select('location_text') // Select only the location_text column

    .not('location_text', 'is', null) // Filter out null location_text values

    .not('location_text', 'eq', '');   // Filter out empty string location_text values



  if (error) {

    console.error("Error fetching company locations for options:", error.message);

    return [];

  }



  if (!data || data.length === 0) {

    return [];

  }



  // Use a Set to collect unique location_text values

  const uniqueLocationTexts = new Set<string>();

  data.forEach((item: { location_text: string | null }) => {

    if (item.location_text && item.location_text.trim() !== '') {

      uniqueLocationTexts.add(item.location_text.trim());

    }

  });



  // Convert the Set of unique texts back to an array of LocationOption objects

  const locationOptions: LocationOption[] = Array.from(uniqueLocationTexts).map(text => ({

    id: text, // Using text as ID for simplicity

    value: text,

    label: text,

  }));



  return locationOptions;

}



export type NewQueueEntryData = Omit<QueueItem, 'id' | 'joined_at' | 'status' | 'position'> & {

  status?: QueueEntryStatus; // Make status optional for insert, default to 'waiting'

  position?: number | null;  // Make position optional and allow null.

                             // The DB often handles position with a default or trigger.

}



// in src/lib/supabase-utils.ts



// src/lib/supabase-utils.ts

// ... (imports)



export function getCompanyWorkingHours(

  company: Company,

  date: Date

): { start: Date; end: Date } | null {

  if (!company.working_hours) {

    return null;

  }

  

  // 1. Use the robust, already-fixed parser from booking-utils.ts

  const parsedWorkingHours = parseWorkingHours(company.working_hours);

  const dayOfWeek = getDay(date);



  // 2. Get the array of time ranges for today

  const dailyHoursRanges = parsedWorkingHours[dayOfWeek];



  // 3. Check if there are any hours defined for today

  if (!dailyHoursRanges || dailyHoursRanges.length === 0) {

    return null; // Company is closed on this day

  }



  // 4. For our purpose, we'll consider the first operational shift of the day.

  // The 'start' and 'end' properties here are already Date objects from the parser.

  const firstRange = dailyHoursRanges[0];



  // 5. Set the correct date component onto the parsed time components.

  const start = setMilliseconds(setSeconds(setMinutes(setHours(date, firstRange.start.getHours()), firstRange.start.getMinutes()), 0), 0);

  const end = setMilliseconds(setSeconds(setMinutes(setHours(date, firstRange.end.getHours()), firstRange.end.getMinutes()), 0), 0);

  

  return { start, end };

}



/**

 * Fetches all occupied slots for a given provider within a date range,

/**
 * In-memory cache & request deduplication for provider occupied slots
 * Prevents flood of duplicate network queries across re-renders and intervals.
 */
const occupiedSlotsCache = new Map<string, { timestamp: number; data: { start_time: string; end_time: string }[] }>();
const occupiedSlotsInFlight = new Map<string, Promise<{ start_time: string; end_time: string }[]>>();

export async function getProviderOccupiedSlots(
  providerId: string,
  startDate: Date,
  endDate: Date
): Promise<{ start_time: string; end_time: string }[]> {
  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();
  const cacheKey = `${providerId}__${startIso}__${endIso}`;

  const cached = occupiedSlotsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 15000) {
    return cached.data;
  }

  if (occupiedSlotsInFlight.has(cacheKey)) {
    return occupiedSlotsInFlight.get(cacheKey)!;
  }

  const fetchPromise = (async () => {
    try {
      // 1. Fetch provider reservations - the single source of truth enforcing the DB exclusion constraint
      const { data: resData, error: resError } = await supabase
        .from('provider_reservations')
        .select('start_time, end_time, source_type, source_row_id')
        .eq('provider_id', providerId)
        .lt('start_time', endIso)
        .gt('end_time', startIso)
        .order('start_time', { ascending: true });

      if (resError) {
        console.error('Error fetching provider occupied slots from provider_reservations:', resError);
      }

      // 2. Fetch active bookings (defensive fallback for any unlinked records)
      const { data: activeBookings, error: bookingErr } = await supabase
        .from('bookings')
        .select('start_time, end_time, status, payment_status')
        .eq('provider_id', providerId)
        .lt('start_time', endIso)
        .gt('end_time', startIso)
        .neq('status', 'cancelled')
        .neq('payment_status', 'rejected');

      if (bookingErr) {
        console.error('Error fetching provider active bookings:', bookingErr);
      }

      // 3. Fetch active queue entries (waiting or serving) for this provider (defensive fallback)
      const { data: activeQueues, error: queueErr } = await supabase
        .from('queue_entries')
        .select('projected_start_time, projected_end_time, status')
        .eq('provider_id', providerId)
        .in('status', ['waiting', 'serving'])
        .lt('projected_start_time', endIso)
        .gt('projected_end_time', startIso);

      if (queueErr) {
        console.error('Error fetching provider active queues:', queueErr);
      }

      const occupiedMap = new Map<string, { start_time: string; end_time: string }>();

      (resData || []).forEach((r) => {
        if (r.start_time && r.end_time) {
          occupiedMap.set(`${r.start_time}_${r.end_time}`, {
            start_time: r.start_time,
            end_time: r.end_time,
          });
        }
      });

      (activeBookings || []).forEach((b) => {
        if (b.start_time && b.end_time) {
          occupiedMap.set(`${b.start_time}_${b.end_time}`, {
            start_time: b.start_time,
            end_time: b.end_time,
          });
        }
      });

      (activeQueues || []).forEach((q) => {
        if (q.projected_start_time && q.projected_end_time) {
          occupiedMap.set(`${q.projected_start_time}_${q.projected_end_time}`, {
            start_time: q.projected_start_time,
            end_time: q.projected_end_time,
          });
        }
      });

      const result = Array.from(occupiedMap.values()).sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );

      occupiedSlotsCache.set(cacheKey, { timestamp: Date.now(), data: result });
      return result;
    } finally {
      occupiedSlotsInFlight.delete(cacheKey);
    }
  })();

  occupiedSlotsInFlight.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/**
 * Batched fetch of occupied slots across multiple providers in a single roundtrip.
 * Drastically reduces network traffic for ANY_PROVIDER mode from 3*N queries to only 3 queries.
 */
export async function getMultiProviderOccupiedSlots(
  providerIds: string[],
  startDate: Date,
  endDate: Date
): Promise<Map<string, { start_time: string; end_time: string }[]>> {
  const result = new Map<string, { start_time: string; end_time: string }[]>();
  if (!providerIds || providerIds.length === 0) return result;

  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();

  const missingProviderIds: string[] = [];
  for (const pid of providerIds) {
    const cacheKey = `${pid}__${startIso}__${endIso}`;
    const cached = occupiedSlotsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 15000) {
      result.set(pid, cached.data);
    } else {
      missingProviderIds.push(pid);
    }
  }

  if (missingProviderIds.length === 0) {
    return result;
  }

  try {
    const [resResp, bookingsResp, queuesResp] = await Promise.all([
      supabase
        .from('provider_reservations')
        .select('provider_id, start_time, end_time')
        .in('provider_id', missingProviderIds)
        .lt('start_time', endIso)
        .gt('end_time', startIso),
      supabase
        .from('bookings')
        .select('provider_id, start_time, end_time')
        .in('provider_id', missingProviderIds)
        .lt('start_time', endIso)
        .gt('end_time', startIso)
        .neq('status', 'cancelled')
        .neq('payment_status', 'rejected'),
      supabase
        .from('queue_entries')
        .select('provider_id, projected_start_time, projected_end_time')
        .in('provider_id', missingProviderIds)
        .in('status', ['waiting', 'serving'])
        .lt('projected_start_time', endIso)
        .gt('projected_end_time', startIso),
    ]);

    const mapByProvider = new Map<string, Map<string, { start_time: string; end_time: string }>>();
    missingProviderIds.forEach((pid) => mapByProvider.set(pid, new Map()));

    (resResp.data || []).forEach((r: any) => {
      if (r.provider_id && r.start_time && r.end_time) {
        mapByProvider.get(r.provider_id)?.set(`${r.start_time}_${r.end_time}`, {
          start_time: r.start_time,
          end_time: r.end_time,
        });
      }
    });

    (bookingsResp.data || []).forEach((b: any) => {
      if (b.provider_id && b.start_time && b.end_time) {
        mapByProvider.get(b.provider_id)?.set(`${b.start_time}_${b.end_time}`, {
          start_time: b.start_time,
          end_time: b.end_time,
        });
      }
    });

    (queuesResp.data || []).forEach((q: any) => {
      if (q.provider_id && q.projected_start_time && q.projected_end_time) {
        mapByProvider.get(q.provider_id)?.set(`${q.projected_start_time}_${q.projected_end_time}`, {
          start_time: q.projected_start_time,
          end_time: q.projected_end_time,
        });
      }
    });

    missingProviderIds.forEach((pid) => {
      const slots = Array.from(mapByProvider.get(pid)?.values() || []).sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
      result.set(pid, slots);
      occupiedSlotsCache.set(`${pid}__${startIso}__${endIso}`, {
        timestamp: Date.now(),
        data: slots,
      });
    });
  } catch (batchErr) {
    console.error("Error in getMultiProviderOccupiedSlots batch query:", batchErr);
    // Fallback: fetch individually if batch fails
    await Promise.all(
      missingProviderIds.map(async (pid) => {
        const slots = await getProviderOccupiedSlots(pid, startDate, endDate);
        result.set(pid, slots);
      })
    );
  }

  return result;
}

/**
 * Batched queue summary in ONE single query instead of N individual count queries.
 */
export async function getServiceQueueSummary(
  serviceId: string,
  providerIds: string[] = []
): Promise<{ overallCount: number; providerCounts: Record<string, number> }> {
  try {
    const { data, error } = await supabase
      .from('queue_entries')
      .select('provider_id')
      .eq('service_id', serviceId)
      .eq('status', 'waiting');

    if (error || !data) {
      return { overallCount: 0, providerCounts: {} };
    }

    const providerCounts: Record<string, number> = {};
    providerIds.forEach((pid) => {
      providerCounts[pid] = 0;
    });

    data.forEach((row: any) => {
      if (row.provider_id) {
        providerCounts[row.provider_id] = (providerCounts[row.provider_id] || 0) + 1;
      }
    });

    const countsList = providerIds.length > 0 ? providerIds.map((pid) => providerCounts[pid] || 0) : [data.length];
    const overallCount = countsList.length > 0 ? Math.min(...countsList) : data.length;

    return { overallCount, providerCounts };
  } catch (err) {
    console.error("Error in getServiceQueueSummary:", err);
    return { overallCount: 0, providerCounts: {} };
  }
}

/**
 * Finds the latest end time for a provider's reservations today.
 * Accounts for current time and company working hours.
 */
export async function getLatestAvailableTimeForProvider(
  company: Company,
  providerId: string,
  serviceId: string
): Promise<Date | null> {
  const now = new Date();

  // If ANY_PROVIDER or empty, calculate the earliest available start time across all service providers
  if (!providerId || providerId === ANY_PROVIDER_ID || providerId === 'ANY_PROVIDER') {
    const activeProviders = (company.providers || []).filter((p: any) => p && p.is_active);
    if (activeProviders.length === 0) {
      return null;
    }

    const { start: dayStart, end: dayEnd } = getDayRange(now);
    const multiOccupied = await getMultiProviderOccupiedSlots(
      activeProviders.map((p: any) => p.id),
      dayStart,
      dayEnd
    );

    const workingHours = getCompanyWorkingHours(company, now);
    if (!workingHours) return null;

    let earliestTime: Date | null = null;
    for (const p of activeProviders) {
      const occupiedSlots = multiOccupied.get(p.id) || [];
      const latestReservationEnd = occupiedSlots.reduce((latest, slot) => {
        const slotEnd = new Date(slot.end_time);
        return isAfter(slotEnd, latest) ? slotEnd : latest;
      }, new Date(0));

      const availableFrom = max([now, workingHours.start, latestReservationEnd]);
      if (!earliestTime || isBefore(availableFrom, earliestTime)) {
        earliestTime = availableFrom;
      }
    }
    return earliestTime;
  }

  const { start: dayStart, end: dayEnd } = getDayRange(now);
  const occupiedSlots = await getProviderOccupiedSlots(providerId, dayStart, dayEnd);

  // Find the latest end time among all reservations today
  const latestReservationEnd = occupiedSlots.reduce((latest, slot) => {
    const slotEnd = new Date(slot.end_time);
    return isAfter(slotEnd, latest) ? slotEnd : latest;
  }, new Date(0));

  // Determine the company's opening time for today
  const workingHours = getCompanyWorkingHours(company, now);
  if (!workingHours) {
    return null; // Company is closed
  }

  // The provider is available at the latest of:
  // 1. The current time ('now')
  // 2. The company's opening time today
  // 3. The end time of their last reservation
  const availableFrom = max([now, workingHours.start, latestReservationEnd]);

  return availableFrom;
}



export async function joinQueue(payload: CreateQueuePayload): Promise<AugmentedQueueItem> {
  let { service_id, provider_id, user_name, phone_number, notes, queue_type } = payload;

  // Require sign-in + completed profile for queue/join
  const { user, profile } = await requireUserAndCompletedProfile();
  user_name = (profile.name ?? user_name ?? "").trim();
  phone_number = (profile.phone_number ?? phone_number ?? "").trim();

  if (!service_id || !user_name) {
    throw new Error("Missing required data to join queue (service or name).");
  }

  const service = await getServiceDetails(service_id);
  if (!service || !service.company) {
    throw new Error("Service details or company not found.");
  }

  const company = service.company;

  // --- AUTO-ASSIGNMENT LOGIC FOR "ANY PROVIDER" ---
  if (!provider_id || provider_id === ANY_PROVIDER_ID) {
    const activeProviders = service.providers?.filter(p => p.is_active) || [];
    if (activeProviders.length === 0) throw new Error("No active providers available.");

    let bestProvider = activeProviders[0];
    let earliestTime: Date | null = null;

    // Find the provider with the earliest available time
    for (const p of activeProviders) {
      const t = await getLatestAvailableTimeForProvider(company, p.id, service_id);
      if (!earliestTime || (t && t < earliestTime)) {
        earliestTime = t;
        bestProvider = p;
      }
    }
    provider_id = bestProvider.id; // Assign to the most available provider
  }

  // --- RESOLVE COMPONENTS & EFFECTIVE DURATION ---
  const activeComponents = service.components || [];
  const compMap = new Map(activeComponents.map((c) => [c.id, c]));

  const selectedCompIds = new Set<string>();
  if (payload.components && payload.components.length > 0) {
    payload.components.forEach((c) => selectedCompIds.add(c.component_id));
  } else if (payload.selected_component_ids && payload.selected_component_ids.length > 0) {
    payload.selected_component_ids.forEach((id) => selectedCompIds.add(id));
  }

  // Enforce required components automatically
  activeComponents.forEach((c) => {
    if (c.is_required) selectedCompIds.add(c.id);
  });

  const resolvedComponents: ServiceComponent[] = [];
  for (const id of Array.from(selectedCompIds)) {
    const comp = compMap.get(id);
    if (comp) resolvedComponents.push(comp);
  }

  const baseWaitTime = service.estimated_wait_time_mins || 30;
  const effectiveDuration = calculateTotalServiceDurationWithComponents(baseWaitTime, resolvedComponents);

  // Recalculate price breakdown authoritatively
  const priceBreakdown = calculateServiceWithComponentsPriceBreakdown(
    service,
    service.service_variants?.find((v) => v.id === payload.service_variant_id) || null,
    resolvedComponents
  );

  let projectedStartTime: Date | null = null;
  let projectedEndTime: Date | null = null;

  try {
    const latestAvailable = await getLatestAvailableTimeForProvider(company, provider_id, service_id);
    if (!latestAvailable) {
      throw new Error("Company is closed today or working hours are not defined.");
    }

    const providerObj =
      service.providers?.find((p) => p.id === provider_id) ||
      ({
        id: provider_id,
        name: "Provider",
        specialization: null,
        is_active: true,
        created_at: new Date().toISOString(),
        company_id: company.id,
      } as Provider);

    const effectiveServiceForSlots = {
      ...service,
      estimated_wait_time_mins: effectiveDuration,
    };

    // Find the next available slot (today or next open day).
    const MAX_DAYS_AHEAD = 14;
    const baseDate = startOfDay(new Date());
    let found: { start: Date; end: Date } | null = null;

    for (let i = 0; i <= MAX_DAYS_AHEAD; i++) {
      const day = addDays(baseDate, i);
      const { start: dayStart, end: dayEnd } = getDayRange(day);
      const occupied = await getProviderOccupiedSlots(provider_id, dayStart, dayEnd);
      let slots = generateAvailableSlots(company, effectiveServiceForSlots, providerObj, day, occupied);

      // For "today", don't show anything before the provider is actually available.
      if (i === 0 && latestAvailable) {
        slots = slots.filter((s) => s.start.getTime() >= latestAvailable.getTime());
      }

      if (slots.length > 0) {
        found = { start: slots[0].start, end: slots[0].end };
        break;
      }
    }

    if (!found) {
      throw new Error("No available time slots found in the next two weeks.");
    }

    projectedStartTime = found.start;
    projectedEndTime = found.end;
  } catch (calcError: any) {
    throw new Error(`Failed to determine an available queue slot: ${calcError.message}`);
  }

  const currentQueueCount = await getCurrentQueueCount(service_id);
  const estimatedPosition = currentQueueCount + 1;
  let createdQueueEntryResult: QueueItem | null = null;

  const safeQueueType = (queue_type === 'walk_in' || queue_type === 'walk-in' || !queue_type) ? 'walk-in' : queue_type;

  try {
    const { data: queueResult, error: queueError } = await supabase.from('queue_entries').insert({
      service_id,
      provider_id,
      user_name,
      phone_number,
      queue_type: safeQueueType,
      status: 'waiting',
      notes,
      user_id: user.id,
      projected_start_time: projectedStartTime!.toISOString(),
      projected_end_time: projectedEndTime!.toISOString(),
      position: estimatedPosition,
      service_variant_id: payload.service_variant_id || null,
      original_price: priceBreakdown.priceBreakdown.isCallForPrice ? null : priceBreakdown.priceBreakdown.originalPrice,
      discount_amount: priceBreakdown.priceBreakdown.discountAmount || 0,
      final_price: priceBreakdown.priceBreakdown.isCallForPrice ? null : priceBreakdown.priceBreakdown.finalPrice,
    }).select().single();

    if (queueError || !queueResult) throw new Error(`Failed to join queue: ${queueError?.message}`);
    createdQueueEntryResult = queueResult as QueueItem;
    
    const { error: reservationError } = await supabase.from('provider_reservations').insert({
      provider_id, service_id,
      start_time: projectedStartTime!.toISOString(),
      end_time: projectedEndTime!.toISOString(),
      source_type: 'queue',
      source_row_id: createdQueueEntryResult.id,
    });

    if (reservationError) throw new Error(`Failed to create reservation: ${reservationError.message}`);

    // Snapshot queue_components if any components selected
    let savedQueueComponents: QueueComponent[] = [];
    if (resolvedComponents.length > 0 && createdQueueEntryResult.id) {
      try {
        const qcompPayloads = resolvedComponents.map((c) => ({
          queue_entry_id: createdQueueEntryResult!.id,
          component_id: c.id,
          price_at_queue: c.is_included ? 0 : Number(c.price) || 0,
          duration_mins: Number(c.duration_mins) || 0,
          quantity: 1,
        }));
        const { data: insertedQComps, error: qcompErr } = await supabase
          .from('queue_components')
          .insert(qcompPayloads)
          .select('*, component:service_components(*)');

        if (!qcompErr && insertedQComps) {
          savedQueueComponents = insertedQComps as any;
        } else if (qcompErr) {
          console.debug("queue_components snapshot insert warning:", qcompErr.message);
        }
      } catch (qcompErr) {
        console.warn("Could not insert queue_components snapshot:", qcompErr);
      }
    }
    
    return { 
      ...createdQueueEntryResult, 
      position: estimatedPosition, 
      estimatedServiceStartTime: projectedStartTime, 
      estimatedServiceEndTime: projectedEndTime,
      queue_components: savedQueueComponents,
    };
  } catch (error: any) {
    if (createdQueueEntryResult?.id) {
      await supabase.from('queue_entries').delete().eq('id', createdQueueEntryResult.id);
    }
    throw error;
  }
}

export async function createBooking(
  bookingData: Omit<Booking, 'id' | 'created_at' | 'status'> & { 
    status?: BookingStatus;
    payment_status?: PaymentStatus;
    components?: MarketplaceBookingComponentInput[];
    selected_component_ids?: string[];
  }
): Promise<Booking> {
  let { provider_id, service_id, start_time, end_time, user_id } = bookingData;

  // 1. Require sign-in + completed profile for booking
  const { user, profile } = await requireUserAndCompletedProfile();
  bookingData.user_id = user.id;
  bookingData.user_name = (profile.name ?? bookingData.user_name ?? "").trim();
  bookingData.phone_number = (profile.phone_number ?? bookingData.phone_number ?? "").trim();

  if (!service_id || !start_time || !end_time) {
    throw new Error("Missing required booking data for reservation.");
  }

  // 2. Validate Service Ownership & Availability from DB
  const { data: dbService, error: serviceErr } = await supabase
    .from('services')
    .select('id, name, company_id, price, status, is_price_visible, discount_type, discount_value, discount_end_date, has_variants, requires_prepayment, prepayment_amount, estimated_wait_time_mins')
    .eq('id', service_id)
    .single();

  if (serviceErr || !dbService || dbService.status !== 'active') {
    throw new Error("Service not found or is currently inactive.");
  }

  if (bookingData.company_id && dbService.company_id !== bookingData.company_id) {
    throw new Error("Service does not belong to the requested company.");
  }

  // 3. Validate Variant/Service relationship
  let dbVariant: ServiceVariant | null = null;
  if (bookingData.service_variant_id) {
    const { data: vData, error: vErr } = await supabase
      .from('service_variants')
      .select('*')
      .eq('id', bookingData.service_variant_id)
      .eq('service_id', service_id)
      .eq('is_active', true)
      .maybeSingle();

    if (vErr || !vData) {
      throw new Error("Selected service option is invalid or inactive.");
    }
    dbVariant = mapToServiceVariant(vData);
  }

  // 4. Fetch & Validate Service Components from DB
  const { data: dbCompsRaw } = await supabase
    .from('service_components')
    .select('*')
    .eq('service_id', service_id)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  const dbComponents = (dbCompsRaw || []).map(mapToServiceComponent);
  const dbCompMap = new Map(dbComponents.map((c) => [c.id, c]));

  // Collect requested components
  const requestedCompIds = new Set<string>();
  const inputCompsMap = new Map<string, MarketplaceBookingComponentInput>();

  if (bookingData.components && bookingData.components.length > 0) {
    bookingData.components.forEach((c) => {
      requestedCompIds.add(c.component_id);
      inputCompsMap.set(c.component_id, c);
    });
  } else if (bookingData.selected_component_ids && bookingData.selected_component_ids.length > 0) {
    bookingData.selected_component_ids.forEach((id) => requestedCompIds.add(id));
  }

  // Enforce required components automatically
  dbComponents.forEach((c) => {
    if (c.is_required) {
      requestedCompIds.add(c.id);
    }
  });

  // Snapshot component details authoritatively
  const componentsToSnapshot: Array<{
    component_id: string;
    provider_id?: string | null;
    quantity: number;
    price_at_booking: number;
    duration_mins: number;
  }> = [];

  for (const compId of Array.from(requestedCompIds)) {
    const comp = dbCompMap.get(compId);
    if (!comp) {
      throw new Error("An invalid or inactive add-on was selected for this service.");
    }
    const inputMeta = inputCompsMap.get(compId);
    componentsToSnapshot.push({
      component_id: comp.id,
      provider_id: inputMeta?.provider_id || provider_id || null,
      quantity: Math.max(1, inputMeta?.quantity || 1),
      price_at_booking: comp.is_included ? 0 : (Number(comp.price) || 0),
      duration_mins: Number(comp.duration_mins) || 0,
    });
  }

  // 5. Server-Authoritative Price Calculation
  const baseItem = dbVariant || dbService;
  const baseBreakdown = calculateItemPriceBreakdown(baseItem);

  let authoritativeOriginalPrice = baseBreakdown.originalPrice || 0;
  let authoritativeDiscountAmount = baseBreakdown.discountAmount || 0;
  let authoritativeFinalPrice = baseBreakdown.finalPrice || 0;

  if (!baseBreakdown.isCallForPrice) {
    const extraAddonsPrice = componentsToSnapshot.reduce(
      (sum, c) => sum + c.price_at_booking * c.quantity,
      0
    );
    authoritativeOriginalPrice += extraAddonsPrice;
    authoritativeFinalPrice = Math.max(0, authoritativeFinalPrice + extraAddonsPrice);
  }

  // 6. AUTO-ASSIGNMENT LOGIC FOR "ANY PROVIDER"
  if (!provider_id || provider_id === ANY_PROVIDER_ID) {
    const fullService = await getServiceDetails(service_id);
    if (!fullService) throw new Error("Service not found. Cannot assign specialist.");

    const activeProviders = fullService.providers?.filter(p => p.is_active) || [];
    let assignedProvider = false;

    if (activeProviders.length > 0) {
      const multiOccupied = await getMultiProviderOccupiedSlots(
        activeProviders.map(p => p.id),
        startOfDay(new Date(start_time)),
        endOfDay(new Date(end_time))
      );

      for (const p of activeProviders) {
        const occupied = multiOccupied.get(p.id) || [];
        const hasOverlap = occupied.some(r => {
          return (new Date(start_time) < new Date(r.end_time)) && (new Date(end_time) > new Date(r.start_time));
        });

        if (!hasOverlap) {
          provider_id = p.id;
          assignedProvider = true;
          break;
        }
      }
    }
    
    if (!assignedProvider) throw new Error("No specialists are available for this specific time slot.");
    bookingData.provider_id = provider_id;
  }

  if (!provider_id || provider_id === ANY_PROVIDER_ID) {
    throw new Error("A valid provider could not be assigned.");
  }

  const bookingStartTime = new Date(start_time);
  const bookingEndTime = new Date(end_time);

  // Check for overlaps using provider_reservations
  const existingReservations = await getProviderOccupiedSlots(
    provider_id,
    startOfDay(bookingStartTime),
    endOfDay(bookingEndTime)
  );

  const newBookingRange = { start: bookingStartTime, end: bookingEndTime };
  const hasOverlap = existingReservations.some(reservation => {
    const existingStart = new Date(reservation.start_time);
    const existingEnd = new Date(reservation.end_time);
    return (newBookingRange.start < existingEnd) && (newBookingRange.end > existingStart);
  });

  if (hasOverlap) {
    throw new Error("The selected time slot is no longer available. Please choose another time.");
  }

  let createdBooking: Booking | null = null;
  try {
    const hasPrepayment = Boolean(dbService.requires_prepayment && (Number(dbService.prepayment_amount) || 0) > 0);
    const servicePrepayment = hasPrepayment ? (Number(dbService.prepayment_amount) || 0) : 0;

    const insertPayload: any = {
      service_id,
      service_variant_id: bookingData.service_variant_id || null,
      company_id: bookingData.company_id || dbService.company_id,
      provider_id,
      user_name: bookingData.user_name,
      phone_number: bookingData.phone_number,
      user_id: user.id,
      start_time,
      end_time,
      status: bookingData.status || (hasPrepayment ? 'pending' : 'confirmed'),
      payment_status: bookingData.payment_status || (hasPrepayment ? 'pending' : 'not_required'),
      notes: bookingData.notes || null,
      original_price: baseBreakdown.isCallForPrice ? null : authoritativeOriginalPrice,
      discount_amount: baseBreakdown.isCallForPrice ? 0 : authoritativeDiscountAmount,
      final_price: baseBreakdown.isCallForPrice ? null : authoritativeFinalPrice,
      amount_paid: bookingData.amount_paid || 0,
      prepayment_amount: servicePrepayment,
    };

    if (bookingData.booking_group_id) {
      insertPayload.booking_group_id = bookingData.booking_group_id;
    }

    let { data: bookingResult, error: bookingError } = await supabase
      .from('bookings')
      .insert(insertPayload)
      .select()
      .single();

    // Fallback if booking_group_id column is not yet migrated to the live database
    if (bookingError && insertPayload.booking_group_id && bookingError.message?.includes('booking_group_id')) {
      console.warn("booking_group_id column missing in live DB. Retrying insert without group id.");
      delete insertPayload.booking_group_id;
      const retry = await supabase.from('bookings').insert(insertPayload).select().single();
      bookingResult = retry.data;
      bookingError = retry.error;
    }

    if (bookingError || !bookingResult) {
      console.error('Supabase booking insert error:', bookingError);
      throw new Error(`Failed to create booking: ${bookingError?.message || 'Unknown error'}`);
    }
    createdBooking = bookingResult as Booking;

    // Create provider reservation
    const { error: reservationError } = await supabase
      .from('provider_reservations')
      .insert({
        provider_id,
        service_id,
        start_time,
        end_time,
        source_type: 'booking',
        source_row_id: createdBooking.id,
      });

    if (reservationError) {
      console.error('Supabase reservation insert error:', reservationError);
      throw new Error(`Failed to create provider reservation: ${reservationError.message || 'Unknown error'}`);
    }

    // Insert snapshot records into booking_components
    let savedBookingComponents: BookingComponent[] = [];
    if (componentsToSnapshot.length > 0 && createdBooking.id) {
      try {
        const bcompPayloads = componentsToSnapshot.map((c) => ({
          booking_id: createdBooking!.id,
          component_id: c.component_id,
          provider_id: c.provider_id || provider_id || null,
          quantity: c.quantity || 1,
          price_at_booking: Number(c.price_at_booking) || 0,
          duration_mins: Number(c.duration_mins) || 0,
        }));

        const { data: insertedComps, error: bcompError } = await supabase
          .from('booking_components')
          .insert(bcompPayloads)
          .select();

        if (!bcompError && insertedComps) {
          savedBookingComponents = insertedComps as any;
        } else if (!bcompError) {
          savedBookingComponents = bcompPayloads.map((bc) => ({
            ...bc,
            id: `snap_${Math.random().toString(36).substring(2, 9)}`,
            created_at: new Date().toISOString(),
          })) as any;
        } else {
          console.warn("booking_components snapshot insert warning (RLS/policy):", bcompError.message);
        }
      } catch (bcInsertErr) {
        console.warn("Could not insert booking_components snapshot:", bcInsertErr);
      }
    }

    return {
      ...createdBooking,
      booking_components: savedBookingComponents,
    };
  } catch (error: any) {
    if (createdBooking?.id) {
      console.warn(`Rolling back partially created booking ${createdBooking.id}:`, error);
      try {
        await supabase.from('provider_reservations').delete().eq('source_row_id', createdBooking.id);
        await supabase.from('booking_components').delete().eq('booking_id', createdBooking.id);
        await supabase.from('bookings').delete().eq('id', createdBooking.id);
      } catch (cleanupErr) {
        console.error("Cleanup error during booking rollback:", cleanupErr);
      }
    }
    throw error;
  }
}

/**
 * Generates an RFC4122 compliant UUID v4 string for booking_group_id.
 */
function generateUUIDv4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Creates multi-service bookings within a single customer checkout flow.
 * Links all appointments with a shared booking_group_id UUID and guarantees transaction safety.
 */
export async function createMultiServiceBookings(
  payload: MultiServiceBookingPayload
): Promise<Booking[]> {
  const groupId = payload.booking_group_id || generateUUIDv4();
  const createdBookings: Booking[] = [];

  try {
    for (const item of payload.bookings) {
      const singleBooking = await createBooking({
        service_id: item.service_id,
        service_variant_id: item.service_variant_id || null,
        company_id: payload.company_id,
        provider_id: item.provider_id || null,
        user_name: payload.user_name,
        phone_number: payload.phone_number,
        start_time: item.start_time,
        end_time: item.end_time,
        notes: item.notes || payload.notes || null,
        booking_group_id: groupId,
        components: item.components,
        selected_component_ids: item.selected_component_ids,
      } as any);

      createdBookings.push(singleBooking);
    }
    return createdBookings;
  } catch (error: any) {
    if (createdBookings.length > 0) {
      const ids = createdBookings.map((b) => b.id);
      console.warn("Rolling back multi-service booking group:", ids);
      try {
        await supabase.from('provider_reservations').delete().in('source_row_id', ids);
        await supabase.from('booking_components').delete().in('booking_id', ids);
        await supabase.from('bookings').delete().in('id', ids);
      } catch (cleanupErr) {
        console.error("Error during multi-booking rollback:", cleanupErr);
      }
    }
    throw error;
  }
}

/**
 * Fetches all bookings belonging to a specific booking_group_id with related components.
 */
export async function getBookingGroupDetails(bookingGroupId: string): Promise<Booking[]> {
  if (!bookingGroupId) return [];
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      service:services(*),
      company:companies(*),
      provider:providers(*),
      service_variant:service_variants(*),
      booking_components:booking_components(*, component:service_components(*))
    `)
    .eq('booking_group_id', bookingGroupId)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching booking group details:', error.message);
    return [];
  }

  return (data || []) as Booking[];
}

export async function getConfirmedBookingsForProvider(

  providerId: string,

  startDate: Date,

  endDate: Date

): Promise<Booking[]> {

  const { data, error } = await supabase

    .from('bookings')

    .select('*')

    .eq('provider_id', providerId)

    .eq('status', 'confirmed') // Only confirmed bookings block slots

    .gte('start_time', startDate.toISOString())

    .lt('end_time', endDate.toISOString())

    .order('start_time', { ascending: true });



  if (error) {

    console.error('Error fetching confirmed bookings:', error);

    throw error;

  }

  return data || [];

}



export async function getBookingDetails(bookingId: string): Promise<Booking | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      service:services(*),
      company:companies(*),
      provider:providers(*),
      service_variant:service_variants(*)
    `)
    .eq('id', bookingId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching booking details:', error.message);
    throw new Error('Failed to fetch booking details.');
  }

  if (!data) return null;

  // Retrieve attached booking components
  try {
    const { data: bcompData, error: bcompError } = await supabase
      .from('booking_components')
      .select(`
        *,
        component:service_components (*),
        provider:providers (*)
      `)
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (!bcompError && bcompData) {
      data.booking_components = bcompData.map((bc: any) => ({
        ...bc,
        price_at_booking: Number(bc.price_at_booking) || 0,
        duration_mins: Number(bc.duration_mins) || 0,
        quantity: Number(bc.quantity) || 1,
        component: bc.component ? mapToServiceComponent(bc.component) : null,
        provider: bc.provider ? mapToProvider(bc.provider) : null,
      }));
    } else {
      data.booking_components = [];
    }
  } catch (bcFetchErr) {
    console.warn("Could not fetch booking components for booking details:", bcFetchErr);
    data.booking_components = [];
  }

  return data as Booking;
}

export async function getQueueEntryDetails(queueId: string): Promise<QueueItem | null> {

    const { data, error } = await supabase

        .from('queue_entries') // Assuming your table name is 'queue_entries'

        .select(`

            *,

            service:services(*),

            company:companies(*),

            provider:providers(*)

        `)

        .eq('id', queueId)

        .single();



    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found

        console.error('Error fetching queue entry details:', error.message);

        throw new Error('Failed to fetch queue entry details.');

    }



    return data;

}



export async function getActiveQueueEntriesForProvider(serviceId: string, providerId: string): Promise<QueueItem[]> {

  const { data, error } = await supabase

    .from('queue_entries')

    .select('*')

    .eq('service_id', serviceId)

    .eq('provider_id', providerId)

    .in('status', ['waiting', 'serving'])

    .order('joined_at', { ascending: true });



  if (error) {

    console.error('Error fetching active queue entries:', error);

    throw error;

  }

  return data || [];

}





// This is the function your public page at app/company/[slug]/page.tsx will use

// export const getCompanyBySlug = async (slug: string): Promise<Company | null> => {

//   try {

//     const { data, error } = await supabase

//       .from('companies')

//       .select(`

//         *,

//         services (

//           *,

//           service_photos ( url )

//         )

//       `)

//       .eq('slug', slug) // <-- The key change: query by slug

//       .single();



//     if (error) throw error;

//     if (!data) return null;



//     // Process photo URLs for services (like we did before)

//     const processedServices = data.services?.map((service: any) => {

//       const photoUrl = service.service_photos?.[0]?.url || null;

//       return { ...service, photo: photoUrl };

//     });



//     return { ...data, services: processedServices } as Company;



//   } catch (error) {

//     console.error('Error fetching company by slug:', error);

//     return null;

//   }

// };



// lib/utils.ts

export function generateSlug(name: string): string {

  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'

  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'

  const p = new RegExp(a.split('').join('|'), 'g')



  return name.toString().toLowerCase()

    .replace(/\s+/g, '-') // Replace spaces with -

    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters

    .replace(/&/g, '-and-') // Replace & with 'and'

    .replace(/[^\w\-]+/g, '') // Remove all non-word chars

    .replace(/\-\-+/g, '-') // Replace multiple - with single -

    .replace(/^-+/, '') // Trim - from start of text

    .replace(/-+$/, '') // Trim - from end of text

}



export async function getRecentCompanies(limit: number = 8): Promise<Company[]> {

  const { data, error } = await supabase

    .from('companies')

    // Include `slug` so UI links can route to /company/<slug>

    .select('id, slug, name, logo, location_text, created_at') // Select only necessary fields for display

    .order('created_at', { ascending: false }) // Order by creation date, newest first

    .limit(limit); // Limit the number of companies returned



  if (error) {

    console.error('Error fetching recent companies:', error);

    return [];

  }

  const companies = (data || []) as Company[];
  await enrichCompaniesWithRatings(companies);
  return companies;

}



export const getFilteredServices = async (

  filters: FilterState

): Promise<Service[]> => {

  try {

    let query = supabase

      .from('services')

      .select(`

        *,

        company:companies (

          *,

          company_types (*) 

        ),

        service_photos ( url )  // <-- THIS IS THE CRUCIAL FIX FOR PHOTOS

      `)

      .eq('status', 'active');



    // Apply category filter

    if (filters.categoryId) {

      query = query.eq('category_id', filters.categoryId);

    }



    // Apply company filter

    if (filters.companyIds && filters.companyIds.length > 0) {

      query = query.in('company_id', filters.companyIds);

    }



    // Execute query to get initial data, then apply client-side filters

    const { data, error } = await query;



    if (error) {

      console.error('Error getting filtered services from Supabase:', error);

      return [];

    }



    if (!data) {

      return [];

    }



    // Map raw data to Service type with nested company/category

    let services: Service[] = data.map((item: any) => mapToService(item));



    // Client-side filtering for company types

    if (filters.companyTypeIds && filters.companyTypeIds.length > 0) {

      services = services.filter(service => {

        const companyTypes = (service.company as any)?.company_company_types || [];

        return companyTypes.some((ct: any) => 

          filters.companyTypeIds.includes(ct.company_type_id)

        );

      });

    }



    // Client-side filtering for location (since server-side filtering on joined text is complex)

    if (filters.locations && filters.locations.length > 0) {

        const locationKeywords = filters.locations.map(loc => loc.value.toLowerCase()); // e.g., "New York, NY"

        services = services.filter(service => {

            const companyLocationText = service.company?.location_text?.toLowerCase();

            const companyAddress = service.company?.address?.toLowerCase();

            return locationKeywords.some(keyword =>

                (companyLocationText && companyLocationText.includes(keyword)) ||

                (companyAddress && companyAddress.includes(keyword))

            );

        });

    }



    // Client-side filtering for searchTerm (to include company.name and description)

    if (filters.searchTerm) {

        const q = filters.searchTerm.trim().toLowerCase();

        if (q.length > 0) {

            const tokens = q.split(/\s+/).filter(Boolean);

            services = services.filter(service => {

                const companyName = service.company?.name?.toLowerCase();

                return tokens.some(token =>

                    (service.name && service.name.toLowerCase().includes(token)) ||

                    (service.code && service.code.toLowerCase().includes(token)) ||

                    (service.description && service.description.toLowerCase().includes(token)) ||

                    (companyName && companyName.includes(token))

                );

            });

        }

    }



    await enrichServicesWithCategories(services);
    await enrichServicesWithCompanyRatings(services);

    return services;



  } catch (error) {

    console.error('Error in getFilteredServices function:', error);

    return [];

  }

};



export async function getCompanyDetailsById(companyId: string): Promise<Company | null> {

  // IMPORTANT: For this query to work, you must have a 'services' table

  // with a 'company_id' column that is a foreign key to 'companies.id'.

  const { data, error } = await supabase

    .from('companies')

    .select(`

      *,

      services (

        *,

        service_photos ( url )

      )

    `)

    .eq('id', companyId)

    .single(); // .single() is perfect for fetching one specific item



  if (error) {

    console.error(`Error fetching details for company ${companyId}:`, error);

    // This will help you debug if the relationship is wrong

    if (error.code === 'PGRST200') {

        console.error("Hint: The error 'PGRST200' (406 Not Acceptable) often means the relationship between 'companies' and 'services' is not correctly defined in the database.");

    }

    return null;

  }



  return data;

}

export async function getCompanyTypeById(typeId: string): Promise<CompanyType | null> {

  const { data, error } = await supabase

    .from('company_types')

    .select('*')

    .eq('id', typeId)

    .single(); // .single() expects exactly one row, which is perfect here



  if (error) {

    console.error(`Error fetching company type ${typeId}:`, error);

    return null;

  }



  return data;

}

export async function getCompaniesByType(typeId: string): Promise<Company[]> {

  const { data, error } = await supabase

    .from('companies')

    // The query syntax '*, company_company_types!inner(*)' tells Supabase:

    // 1. Select all columns from the 'companies' table (*).

    // 2. Do an INNER JOIN on 'company_company_types'. !inner ensures we only get

    //    companies that actually have a type assigned.

    .select('*, company_company_types!inner(company_type_id)')

    // 3. Filter the joined table to only include rows where the type ID matches.

    .eq('company_company_types.company_type_id', typeId);



  if (error) {

    console.error(`Error fetching companies for type ${typeId}:`, error);

    return [];

  }



  const companies = (data || []) as Company[];
  await enrichCompaniesWithRatings(companies);
  return companies;

}

export async function getCompanyTypesWithCounts(): Promise<CompanyTypeWithCount[]> {

  // We use .rpc() to call the PostgreSQL function we created

  const { data, error } = await supabase.rpc('get_company_types_with_company_counts');



  if (error) {

    console.error("Error fetching company types with counts:", error);

    return []; // Return an empty array on failure

  }



  // The 'data' will be an array of objects matching our CompanyTypeWithCount type

  return data || [];

}

export async function enrichCompaniesWithRatings(companies: Company[]): Promise<void> {
  if (!companies || companies.length === 0) return;
  const companyIds = Array.from(new Set(companies.map((c) => c.id).filter(Boolean)));
  if (companyIds.length === 0) return;

  try {
    const { data: ratingSummaries, error } = await supabase
      .from('company_rating_summary')
      .select('company_id, average_stars, total_ratings')
      .in('company_id', companyIds);

    if (!error && ratingSummaries) {
      const summaryMap = new Map<string, { average_stars: number; total_ratings: number }>();
      ratingSummaries.forEach((r: any) => {
        if (r.company_id) {
          summaryMap.set(r.company_id, {
            average_stars: Number(r.average_stars) || 0,
            total_ratings: Number(r.total_ratings) || 0,
          });
        }
      });

      companies.forEach((c) => {
        c.rating_summary = summaryMap.get(c.id) || null;
      });
    }
  } catch (err) {
    console.error("Error enriching companies with rating summaries:", err);
  }
}

export async function enrichServicesWithCompanyRatings(services: Service[]): Promise<void> {
  if (!services || services.length === 0) return;
  const companyIds = new Set<string>();
  services.forEach((s) => {
    if (s.company_id) companyIds.add(s.company_id);
    if (s.company?.id) companyIds.add(s.company.id);
  });

  if (companyIds.size === 0) return;

  try {
    const { data: ratingSummaries, error } = await supabase
      .from('company_rating_summary')
      .select('company_id, average_stars, total_ratings')
      .in('company_id', Array.from(companyIds));

    if (!error && ratingSummaries) {
      const summaryMap = new Map<string, { average_stars: number; total_ratings: number }>();
      ratingSummaries.forEach((r: any) => {
        if (r.company_id) {
          summaryMap.set(r.company_id, {
            average_stars: Number(r.average_stars) || 0,
            total_ratings: Number(r.total_ratings) || 0,
          });
        }
      });

      services.forEach((s) => {
        const rating = (s.company_id ? summaryMap.get(s.company_id) : null) || (s.company?.id ? summaryMap.get(s.company.id) : null) || null;
        if (s.company) {
          s.company.rating_summary = rating;
        }
      });
    }
  } catch (err) {
    console.error("Error enriching services with company ratings:", err);
  }
}

// Helper function to enrich service objects with their service_category using category_id
export async function enrichServicesWithCategories(services: Service[]): Promise<void> {
  if (!services || services.length === 0) return;

  const categoryIds = new Set<string>();

  services.forEach((s) => {
    if (s.category_id) categoryIds.add(s.category_id);
    if (s.included_services && Array.isArray(s.included_services)) {
      s.included_services.forEach((sub) => {
        if (sub.category_id) categoryIds.add(sub.category_id);
      });
    }
  });

  if (categoryIds.size === 0) return;

  try {
    const { data: categories, error } = await supabase
      .from('service_categories')
      .select('id, name')
      .in('id', Array.from(categoryIds));

    if (!error && categories) {
      const categoryMap = new Map<string, string>();
      categories.forEach((cat: any) => categoryMap.set(cat.id, cat.name));

      services.forEach((s) => {
        if (s.category_id && categoryMap.has(s.category_id)) {
          s.service_category = { name: categoryMap.get(s.category_id)! };
        }
        if (s.included_services && Array.isArray(s.included_services)) {
          s.included_services.forEach((sub) => {
            if (sub.category_id && categoryMap.has(sub.category_id)) {
              sub.service_category = { name: categoryMap.get(sub.category_id)! };
            }
          });
        }
      });
    }
  } catch (err) {
    console.error("Error enriching services with category names:", err);
  }
}

// Helper function to enrich services with their active service_variants
export async function enrichServicesWithVariants(services: Service[]): Promise<void> {
  if (!services || services.length === 0) return;

  const serviceIdsWithVariants = services
    .filter((s) => s.has_variants)
    .map((s) => s.id);

  if (serviceIdsWithVariants.length === 0) return;

  try {
    const { data: variants, error } = await supabase
      .from('service_variants')
      .select('*')
      .in('service_id', serviceIdsWithVariants)
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (!error && variants) {
      const variantMap = new Map<string, ServiceVariant[]>();
      variants.forEach((v: any) => {
        const mapped = mapToServiceVariant(v);
        const list = variantMap.get(v.service_id) || [];
        list.push(mapped);
        variantMap.set(v.service_id, list);
      });

      services.forEach((s) => {
        if (variantMap.has(s.id)) {
          s.service_variants = variantMap.get(s.id)!;
        }
      });
    }
  } catch (err) {
    console.warn("Could not enrich services with variants:", err);
  }
}

// Helper function to enrich packages with package_items
export async function enrichPackagesWithInclusions(packages: Service[]): Promise<void> {
  if (!packages || packages.length === 0) return;

  const packageIds = packages
    .filter((p) => p.is_package)
    .map((p) => p.id);

  if (packageIds.length === 0) return;

  try {
    const { data: items, error } = await supabase
      .from('package_items')
      .select(`
        *,
        linked_service:services (*),
        linked_variant:service_variants (*)
      `)
      .in('package_id', packageIds)
      .order('display_order', { ascending: true });

    if (!error && items) {
      const itemMap = new Map<string, PackageItem[]>();
      items.forEach((item: any) => {
        const pkgId = item.package_id || item.service_id;
        if (pkgId) {
          const mapped: PackageItem = {
            id: item.id,
            package_id: item.package_id,
            service_id: item.service_id,
            item_type: item.item_type || (item.linked_service_id ? 'service' : 'custom'),
            linked_service_id: item.linked_service_id,
            linked_variant_id: item.linked_variant_id,
            service_variant_id: item.service_variant_id || item.linked_variant_id,
            custom_name: item.custom_name,
            quantity: item.quantity,
            display_order: item.display_order,
            created_at: item.created_at,
            linked_service: item.linked_service ? mapToService(item.linked_service) : undefined,
            service: item.linked_service ? mapToService(item.linked_service) : undefined,
            linked_variant: item.linked_variant ? mapToServiceVariant(item.linked_variant) : undefined,
            service_variant: item.linked_variant ? mapToServiceVariant(item.linked_variant) : undefined,
          };
          const list = itemMap.get(pkgId) || [];
          list.push(mapped);
          itemMap.set(pkgId, list);
        }
      });

      packages.forEach((pkg) => {
        if (itemMap.has(pkg.id)) {
          pkg.package_items = itemMap.get(pkg.id)!;
        }
      });
    }
  } catch (err) {
    console.warn("Could not enrich packages with inclusions:", err);
  }
}

// Helper function to enrich services with active service_components (Phases & Add-ons)
export async function enrichServicesWithComponents(services: Service[]): Promise<void> {
  if (!services || services.length === 0) return;

  const serviceIds = services.map((s) => s.id).filter(Boolean);
  if (serviceIds.length === 0) return;

  try {
    const { data: components, error } = await supabase
      .from('service_components')
      .select('*')
      .in('service_id', serviceIds)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (!error && components) {
      const compMap = new Map<string, ServiceComponent[]>();
      components.forEach((c: any) => {
        const mapped = mapToServiceComponent(c);
        const list = compMap.get(c.service_id) || [];
        list.push(mapped);
        compMap.set(c.service_id, list);
      });

      services.forEach((s) => {
        const comps = compMap.get(s.id) || [];
        s.components = comps;
        s.service_components = comps;
      });
    }
  } catch (err) {
    console.warn("Could not enrich services with components:", err);
  }
}

// Fetch active service components for a specific service
export async function getServiceComponents(
  serviceId: string,
  onlyActive: boolean = true
): Promise<ServiceComponent[]> {
  try {
    let query = supabase
      .from('service_components')
      .select('*')
      .eq('service_id', serviceId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching service components:', error);
      return [];
    }
    return (data || []).map(mapToServiceComponent);
  } catch (err) {
    console.error('Error in getServiceComponents:', err);
    return [];
  }
}

// Fetch booking components for a confirmed booking
export async function getBookingComponents(bookingId: string): Promise<BookingComponent[]> {
  try {
    const { data, error } = await supabase
      .from('booking_components')
      .select(`
        *,
        component:service_components (*),
        provider:providers (*)
      `)
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching booking components:', error);
      return [];
    }
    return (data || []).map((bc: any) => ({
      ...bc,
      price_at_booking: Number(bc.price_at_booking) || 0,
      duration_mins: Number(bc.duration_mins) || 0,
      quantity: Number(bc.quantity) || 1,
      component: bc.component ? mapToServiceComponent(bc.component) : null,
      provider: bc.provider ? mapToProvider(bc.provider) : null,
    }));
  } catch (err) {
    console.error('Error in getBookingComponents:', err);
    return [];
  }
}

// Helper function to format included categories as "Haircut + Beard Trim + Wash"
export function formatPackageCategories(service: Service): string {
  if (service.package_items && service.package_items.length > 0) {
    const names = service.package_items.map((item) => {
      if (item.item_type === 'custom') return item.custom_name;
      return item.linked_service?.service_category?.name || item.linked_service?.name || item.custom_name;
    }).filter(Boolean);
    if (names.length > 0) {
      return Array.from(new Set(names)).join(" + ");
    }
  }

  if (service.included_services && service.included_services.length > 0) {
    const categoryNames = service.included_services.map((sub) => {
      return sub.service_category?.name || sub.name;
    }).filter(Boolean);
    if (categoryNames.length > 0) {
      return Array.from(new Set(categoryNames)).join(" + ");
    }
  }
  return service.description || "";
}

// Fetch all active package services with company and sub-service categories resolved
export async function getAllPackages(limit?: number): Promise<Service[]> {
  try {
    let query = supabase
      .from('services')
      .select(`
        *,
        company:companies (
          id,
          name,
          logo,
          location_text
        ),
        service_photos ( url )
      `)
      .eq('is_package', true)
      .eq('status', 'active');

    if (limit && limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching packages:", error);
      return [];
    }

    if (!data) return [];

    const packages: Service[] = data.map((raw: any) => {
      let parsedIncludedIds: string[] = [];
      if (raw.included_service_ids) {
        if (Array.isArray(raw.included_service_ids)) {
          parsedIncludedIds = raw.included_service_ids;
        } else if (typeof raw.included_service_ids === 'string') {
          try {
            const parsed = JSON.parse(raw.included_service_ids);
            if (Array.isArray(parsed)) parsedIncludedIds = parsed;
          } catch {
            parsedIncludedIds = [];
          }
        }
      }

      const photoUrl = raw.service_photos?.[0]?.url || raw.photo || null;

      return {
        ...mapToService(raw),
        photo: photoUrl,
        service_photos: raw.service_photos || [],
        company: raw.company,
        included_service_ids: parsedIncludedIds,
      };
    });

    for (const pkg of packages) {
      if (Array.isArray(pkg.included_service_ids) && pkg.included_service_ids.length > 0) {
        try {
          const { data: subServicesData } = await supabase
            .from('services')
            .select('*, service_photos(url)')
            .in('id', pkg.included_service_ids);

          if (subServicesData) {
            pkg.included_services = subServicesData.map((sub: any) => ({
              ...mapToService(sub),
              photo: sub.service_photos?.[0]?.url || sub.photo || null,
            }));
            await enrichServicesWithCategories(pkg.included_services);
          }
        } catch (err) {
          console.error(`Error resolving included services for package ${pkg.id}:`, err);
        }
      }
    }

    await enrichPackagesWithInclusions(packages);
    await enrichServicesWithCategories(packages);
    await enrichServicesWithCompanyRatings(packages);
    await enrichServicesWithVariants(packages);

    return packages;
  } catch (error) {
    console.error("Error in getAllPackages:", error);
    return [];
  }
}

// Fetch single package by ID with full company and included services breakdown
export async function getPackageById(packageId: string): Promise<Service | null> {
  try {
    const { data: rawServiceData, error } = await supabase
      .from('services')
      .select(`
        *,
        company:companies (
          id,
          name,
          logo,
          phone,
          email,
          address,
          location_text
        ),
        service_photos ( url )
      `)
      .eq('id', packageId)
      .single();

    if (error || !rawServiceData) {
      console.error(`Error fetching package details for ID ${packageId}:`, error);
      return null;
    }

    let parsedIncludedIds: string[] = [];
    if (rawServiceData.included_service_ids) {
      if (Array.isArray(rawServiceData.included_service_ids)) {
        parsedIncludedIds = rawServiceData.included_service_ids;
      } else if (typeof rawServiceData.included_service_ids === 'string') {
        try {
          const parsed = JSON.parse(rawServiceData.included_service_ids);
          if (Array.isArray(parsed)) parsedIncludedIds = parsed;
        } catch {
          parsedIncludedIds = [];
        }
      }
    }

    const photoUrl = rawServiceData.service_photos?.[0]?.url || rawServiceData.photo || null;

    const packageService: Service = {
      ...mapToService(rawServiceData),
      photo: photoUrl,
      service_photos: rawServiceData.service_photos || [],
      company: rawServiceData.company,
      included_service_ids: parsedIncludedIds,
    };

    if (Array.isArray(packageService.included_service_ids) && packageService.included_service_ids.length > 0) {
      try {
        const { data: subServicesData } = await supabase
          .from('services')
          .select('*, service_photos(url)')
          .in('id', packageService.included_service_ids);

        if (subServicesData) {
          packageService.included_services = subServicesData.map((sub: any) => ({
            ...mapToService(sub),
            photo: sub.service_photos?.[0]?.url || sub.photo || null,
          }));
        }
      } catch (err) {
        console.error(`Error resolving included services for package ${packageId}:`, err);
      }
    }

    await enrichPackagesWithInclusions([packageService]);
    await enrichServicesWithCategories([packageService]);
    await enrichServicesWithVariants([packageService]);

    return packageService;
  } catch (error) {
    console.error(`Error in getPackageById for ${packageId}:`, error);
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════════════
// USER FAVORITES / SAVED SERVICES (public.user_favorites table)
// ══════════════════════════════════════════════════════════════════════════

/**
 * Fetch all saved services for the currently authenticated user
 */
export async function getMySavedServices(): Promise<Service[]> {
  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return [];

    const { data: favorites, error: favErr } = await supabase
      .from('user_favorites')
      .select('service_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (favErr || !favorites || favorites.length === 0) {
      return [];
    }

    const serviceIds = favorites.map((f: any) => f.service_id);

    const { data: servicesData, error: servicesErr } = await supabase
      .from('services')
      .select(`
        *,
        company:companies (
          id,
          name,
          logo,
          phone,
          email,
          address,
          location_text
        ),
        service_photos ( url )
      `)
      .in('id', serviceIds);

    if (servicesErr || !servicesData) {
      console.error('Error fetching saved services details:', servicesErr);
      return [];
    }

    const formattedServices: Service[] = servicesData.map((raw: any) => {
      const photoUrl = raw.service_photos?.[0]?.url || raw.photo || null;
      return {
        ...mapToService(raw),
        photo: photoUrl,
        service_photos: raw.service_photos || [],
        company: raw.company,
      };
    });

    await enrichServicesWithCategories(formattedServices);

    return formattedServices;
  } catch (error) {
    console.error('Error in getMySavedServices:', error);
    return [];
  }
}

/**
 * Get array of favorited service IDs for the current user
 */
export async function getMyFavoriteServiceIds(): Promise<string[]> {
  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return [];

    const { data: favorites, error: favErr } = await supabase
      .from('user_favorites')
      .select('service_id')
      .eq('user_id', user.id);

    if (favErr || !favorites) return [];

    return favorites.map((f: any) => f.service_id);
  } catch (error) {
    console.error('Error in getMyFavoriteServiceIds:', error);
    return [];
  }
}

/**
 * Toggle favorite status for a service.
 * Returns { isFavorited: boolean }
 */
export async function toggleServiceFavorite(serviceId: string): Promise<{ isFavorited: boolean }> {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    const err: any = new Error("Please sign in to save services to your favorites.");
    err.code = "AUTH_REQUIRED";
    throw err;
  }

  // Check if favorite already exists
  const { data: existing, error: checkErr } = await supabase
    .from('user_favorites')
    .select('service_id')
    .eq('user_id', user.id)
    .eq('service_id', serviceId)
    .maybeSingle();

  if (existing) {
    // Remove from favorites
    const { error: delErr } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('service_id', serviceId);

    if (delErr) throw delErr;
    return { isFavorited: false };
  } else {
    // Add to favorites
    const { error: insErr } = await supabase
      .from('user_favorites')
      .insert({
        user_id: user.id,
        service_id: serviceId,
      });

    if (insErr) throw insErr;
    return { isFavorited: true };
  }
}
