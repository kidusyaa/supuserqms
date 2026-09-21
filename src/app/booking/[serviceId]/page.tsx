"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import { Icon } from "@iconify/react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type {
  Service,
  Provider,
  Company,
  QueueItem,
  AvailableSlot,
  Booking,
  BookingStatus,
  PaymentStatus,
} from "@/type";
import { ANY_PROVIDER_ID } from "@/type";
import {
  getServiceDetails,
  getCurrentQueueCount,
  getProviderOccupiedSlots,
  getLatestAvailableTimeForProvider,
  calculateItemPriceBreakdown,
  calculateServiceStartingPrice,
  getAuthUserOrNull,
  getMyProfileOrNull,
  createBooking,
  joinQueue,
} from "@/lib/supabase-utils";
import {
  getCompanyWorkingHoursForDay,
  generateAvailableSlots,
  getDayRange,
} from "@/lib/booking-utils";
import {
  startOfDay,
  format,
  isToday,
} from "date-fns";
import PaymentVerificationModal from "@/components/book/_componet/PaymentVerificationModal";
import { QueueConfirmationDialog } from "@/components/book/_componet/QueueConfirmationDialog";
import ServiceVideoModal from "@/components/ServiceVideoModal";
import AppointmentScheduler from "../_componets/AppointmentScheduler";
import BookingBreadcrumb from "../_componets/BookingBreadcrumb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ConfirmedQueueItem extends QueueItem {
  estimatedServiceStartTime?: Date | null;
  estimatedServiceEndTime?: Date | null;
}

type StepKey = "details" | "option" | "specialist" | "when" | "confirm";

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serviceId = params.serviceId as string;
  const initialVariantId = searchParams.get("variantId");

  // ── States ────────────────────────────────────────────────────────
  const [service, setService] = useState<Service | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(initialVariantId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string>(ANY_PROVIDER_ID);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [bookingTab, setBookingTab] = useState<"appointment" | "queue">("appointment");

  // Wizard Navigation (Starts on Step 0: "details" for service overview)
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Media Gallery & Details state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);
  const thumbnailRef = useRef<HTMLDivElement>(null);

  // Customer Input for Final Step
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialogs
  const [paymentVerificationModalOpen, setPaymentVerificationModalOpen] = useState(false);
  const [pendingBookingForPayment, setPendingBookingForPayment] = useState<Booking | null>(null);
  const [queueConfirmationDialogOpen, setQueueConfirmationDialogOpen] = useState(false);
  const [confirmedQueueEntry, setConfirmedQueueEntry] = useState<ConfirmedQueueItem | null>(null);

  // Slots & Queue
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [estimatedQueueStartTime, setEstimatedQueueStartTime] = useState<Date | null>(null);
  const [providerQueueCounts, setProviderQueueCounts] = useState<Record<string, number>>({});

  const company = useMemo(() => service?.company, [service]);

  // Active variants
  const activeVariants = useMemo(() => {
    if (!service?.has_variants || !service.service_variants) return [];
    return service.service_variants.filter((v) => v.is_active !== false);
  }, [service?.has_variants, service?.service_variants]);

  const hasVariants = activeVariants.length > 0;

  // Compute all steps dynamically based on whether service has variants
  // Step 1 is always "Details" so customer reviews service details first!
  const allSteps = useMemo(() => {
    if (hasVariants) {
      return [
        { key: "details" as StepKey, label: "Details", number: 1 },
        { key: "option" as StepKey, label: "Option", number: 2 },
        { key: "specialist" as StepKey, label: "Specialist", number: 3 },
        { key: "when" as StepKey, label: "When", number: 4 },
        { key: "confirm" as StepKey, label: "Confirm", number: 5 },
      ];
    }
    return [
      { key: "details" as StepKey, label: "Details", number: 1 },
      { key: "specialist" as StepKey, label: "Specialist", number: 2 },
      { key: "when" as StepKey, label: "When", number: 3 },
      { key: "confirm" as StepKey, label: "Confirm", number: 4 },
    ];
  }, [hasVariants]);

  const currentStep = allSteps[currentStepIndex]?.key || "details";

  // Selected Provider Object
  const selectedProvider = useMemo(() => {
    if (!selectedProviderId) return undefined;

    if (selectedProviderId === ANY_PROVIDER_ID) {
      return {
        id: ANY_PROVIDER_ID,
        name: "Any Specialist",
        specialization: "First available certified specialist",
        is_active: true,
        company_id: company?.id || "",
        created_at: new Date().toISOString(),
        isAny: true,
      } as Provider;
    }
    return service?.providers?.find((p) => p.id === selectedProviderId);
  }, [service?.providers, selectedProviderId, company?.id]);

  // Selected Variant computation
  const selectedVariant = useMemo(() => {
    if (!hasVariants || !selectedVariantId) return null;
    return activeVariants.find((v) => v.id === selectedVariantId) || null;
  }, [hasVariants, selectedVariantId, activeVariants]);

  // Effective service for slots & duration calculations
  const effectiveService = useMemo(() => {
    if (!service) return null;
    if (selectedVariant?.duration_mins) {
      return {
        ...service,
        estimated_wait_time_mins: selectedVariant.duration_mins,
      };
    }
    return service;
  }, [service, selectedVariant]);

  // Pricing calculations
  const startingPriceInfo = useMemo(() => {
    if (!service) return { minPrice: null, originalPrice: null, hasDiscount: false, isCallForPrice: false };
    return calculateServiceStartingPrice(service);
  }, [service]);

  const effectivePriceBreakdown = useMemo(() => {
    if (!service) return null;
    return calculateItemPriceBreakdown(selectedVariant || service);
  }, [service, selectedVariant]);

  // Open status check
  const isCompanyOpenToday = useMemo(() => {
    if (!company) return false;
    const todayHours = getCompanyWorkingHoursForDay(company, new Date());
    return todayHours !== null;
  }, [company]);

  // --- Unique Images Determination ---
  const uniqueImageUrls = useMemo(() => {
    if (!service) return [];
    const set = new Set<string>();
    if (service.photo) set.add(service.photo);
    if (service.service_photos && service.service_photos.length > 0) {
      service.service_photos.forEach((p) => {
        if (p.url) set.add(p.url);
      });
    }
    if (service.is_package && service.included_services && service.included_services.length > 0) {
      service.included_services.forEach((sub) => {
        if (sub.photo) set.add(sub.photo);
        if (sub.service_photos && sub.service_photos.length > 0) {
          sub.service_photos.forEach((p) => {
            if (p.url) set.add(p.url);
          });
        }
      });
    }
    return Array.from(set);
  }, [service]);

  const nextImage = () => {
    if (uniqueImageUrls.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % uniqueImageUrls.length);
    }
  };

  const prevImage = () => {
    if (uniqueImageUrls.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + uniqueImageUrls.length) % uniqueImageUrls.length);
    }
  };

  // Auto-slide photos when on details step
  useEffect(() => {
    if (uniqueImageUrls.length <= 1 || isAutoPlayPaused || selectedLightboxImage || currentStep !== "details") return;
    const id = window.setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % uniqueImageUrls.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, [uniqueImageUrls.length, isAutoPlayPaused, selectedLightboxImage, currentStep]);

  // ── Fetch Initial Service Data ─────────────────────────────────────
  useEffect(() => {
    if (!serviceId) {
      setError("Service ID is missing.");
      setLoading(false);
      return;
    }
    const fetchServiceData = async () => {
      setLoading(true);
      try {
        const data = await getServiceDetails(serviceId);
        if (!data || !data.company) throw new Error("Service or company not found.");
        setService(data);

        // Variant selection initialization
        if (data.has_variants && data.service_variants && data.service_variants.length > 0) {
          const active = data.service_variants.filter((v) => v.is_active !== false);
          if (active.length > 0) {
            if (initialVariantId && active.some((v) => v.id === initialVariantId)) {
              setSelectedVariantId(initialVariantId);
            } else {
              setSelectedVariantId(null);
            }
          }
        }

        const activeProviders = (data.providers || []).filter((p) => p.is_active);
        if (activeProviders.length === 1) {
          setSelectedProviderId(activeProviders[0].id);
        } else {
          setSelectedProviderId(ANY_PROVIDER_ID);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load service details.");
      } finally {
        setLoading(false);
      }
    };
    fetchServiceData();
  }, [serviceId, initialVariantId]);

  // Prefill user profile if logged in
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const p = await getMyProfileOrNull();
        if (p) {
          if (p.name) setCustomerName(p.name);
          if (p.phone_number) setCustomerPhone(p.phone_number);
        }
      } catch {
        // silent
      }
    };
    fetchProfile();
  }, []);

  // ── Fetch Appointment Slots ───────────────────────────────────────
  useEffect(() => {
    if (!effectiveService || !company || !selectedDate || !selectedProvider || bookingTab !== "appointment") {
      setAvailableSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setSlotsLoading(true);
      try {
        const { start: dayStart, end: dayEnd } = getDayRange(selectedDate);

        if (selectedProviderId === ANY_PROVIDER_ID) {
          const activeProviders = (effectiveService.providers || []).filter((p) => p.is_active);
          if (activeProviders.length === 0) {
            const fallbackProvider: Provider = {
              id: ANY_PROVIDER_ID,
              name: "Specialist",
              specialization: "Certified Specialist",
              is_active: true,
              company_id: company.id,
              created_at: new Date().toISOString(),
              isAny: true,
            };
            const slots = generateAvailableSlots(
              company,
              effectiveService,
              fallbackProvider,
              selectedDate,
              []
            );
            setAvailableSlots(slots);
            return;
          }

          const perProviderOccupied = await Promise.all(
            activeProviders.map(async (p) => ({
              provider: p,
              occupied: await getProviderOccupiedSlots(p.id, dayStart, dayEnd),
            }))
          );

          const slotMap = new Map<string, AvailableSlot>();
          for (const { provider, occupied } of perProviderOccupied) {
            const slotsForProvider = generateAvailableSlots(
              company,
              effectiveService,
              provider,
              selectedDate,
              occupied
            );
            for (const s of slotsForProvider) {
              const key = `${s.start.toISOString()}__${s.end.toISOString()}`;
              if (!slotMap.has(key)) slotMap.set(key, s);
            }
          }

          const merged = Array.from(slotMap.values()).sort(
            (a, b) => a.start.getTime() - b.start.getTime()
          );
          setAvailableSlots(merged);
        } else {
          const occupiedSlots = await getProviderOccupiedSlots(
            selectedProvider.id,
            dayStart,
            dayEnd
          );
          const slots = generateAvailableSlots(
            company,
            effectiveService,
            selectedProvider,
            selectedDate,
            occupiedSlots
          );
          setAvailableSlots(slots);
        }
      } catch (err) {
        console.error("Error fetching slots:", err);
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchSlots();
  }, [effectiveService, company, selectedDate, selectedProviderId, bookingTab, selectedProvider]);

  // ── Fetch Live Queue & Estimates ─────────────────────────────────
  const fetchQueueData = useCallback(async () => {
    if (!service || !company || !selectedProvider) return;

    try {
      const count = await getCurrentQueueCount(service.id, selectedProviderId);
      setQueueCount(count);

      const estimate = await getLatestAvailableTimeForProvider(
        company,
        selectedProviderId,
        service.id
      );
      setEstimatedQueueStartTime(estimate);

      if (service.providers && service.providers.length > 0) {
        const counts: Record<string, number> = {};
        await Promise.all(
          service.providers.map(async (p) => {
            counts[p.id] = await getCurrentQueueCount(service.id, p.id);
          })
        );
        setProviderQueueCounts(counts);
      }
    } catch (err) {
      console.error("Error fetching queue data:", err);
    }
  }, [service, company, selectedProvider, selectedProviderId]);

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 30000);
    return () => clearInterval(interval);
  }, [fetchQueueData]);

  // ── Validation & Step Navigation ──────────────────────────────────
  const canProceed = useMemo(() => {
    if (currentStep === "details") {
      return true; // Always allow moving from Details to Option/Specialist
    }
    if (currentStep === "option") {
      return Boolean(selectedVariantId);
    }
    if (currentStep === "specialist") {
      return Boolean(selectedProviderId);
    }
    if (currentStep === "when") {
      if (bookingTab === "appointment") {
        return Boolean(selectedSlot);
      }
      return Boolean(isCompanyOpenToday);
    }
    if (currentStep === "confirm") {
      return Boolean(customerName.trim().length > 0 && customerPhone.trim().length >= 9);
    }
    return true;
  }, [currentStep, selectedVariantId, selectedProviderId, bookingTab, selectedSlot, isCompanyOpenToday, customerName, customerPhone]);

  const handleNextStep = () => {
    if (currentStep === "option" && !selectedVariantId) {
      toast.error("Please select an option to continue.");
      return;
    }
    if (currentStep === "when") {
      if (bookingTab === "appointment" && !selectedSlot) {
        toast.error("Please select a time slot to continue.");
        return;
      }
      if (bookingTab === "queue" && !isCompanyOpenToday) {
        toast.error("The salon is closed today. Please schedule for another date.");
        return;
      }
    }

    if (currentStepIndex < allSteps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Final confirmation step
      handleFinalSubmit();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ── Final Booking Confirmation ────────────────────────────────────
  const handleFinalSubmit = async () => {
    if (!service || !company || !selectedProvider) return;

    if (!customerName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 9) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await getAuthUserOrNull();
      if (!user) {
        toast.info("Please sign in to confirm your booking.");
        router.push(`/auth?next=${encodeURIComponent(pathname || "/")}`);
        return;
      }

      if (bookingTab === "appointment") {
        if (!selectedSlot) {
          toast.error("Please select an appointment time slot.");
          const whenIdx = allSteps.findIndex((s) => s.key === "when");
          if (whenIdx !== -1) setCurrentStepIndex(whenIdx);
          return;
        }

        const requiresPrepayment = Boolean(
          service.requires_prepayment && (service.prepayment_amount || 0) > 0
        );

        const newBookingData = {
          user_id: user.id,
          user_name: customerName.trim(),
          phone_number: customerPhone.trim(),
          service_id: service.id,
          company_id: company.id,
          provider_id: selectedProvider.id,
          start_time: selectedSlot.start.toISOString(),
          end_time: selectedSlot.end.toISOString(),
          status: (requiresPrepayment ? "pending" : "confirmed") as BookingStatus,
          payment_status: (requiresPrepayment ? "pending" : "not_required") as PaymentStatus,
          notes: customerNotes.trim() || null,
          service_variant_id: selectedVariant?.id || null,
          original_price: effectivePriceBreakdown?.originalPrice || null,
          discount_amount: effectivePriceBreakdown?.discountAmount || 0,
          final_price: effectivePriceBreakdown?.finalPrice || null,
        };

        const createdBooking = await createBooking(newBookingData);
        if (!createdBooking || !createdBooking.id) {
          throw new Error("Booking created but no ID was returned.");
        }

        if (requiresPrepayment) {
          toast.info("Booking reserved! Please upload prepayment verification.");
          setPendingBookingForPayment(createdBooking);
          setPaymentVerificationModalOpen(true);
        } else {
          toast.success("Appointment booked successfully!");
          router.push(`/booking/confirmation/${createdBooking.id}`);
        }
      } else {
        // Join Live Queue
        const queuePayload = {
          service_id: service.id,
          provider_id: selectedProvider.isAny ? null : selectedProvider.id,
          notes: customerNotes.trim() || null,
          queue_type: "walk_in" as const,
          service_variant_id: selectedVariant?.id || null,
          original_price: effectivePriceBreakdown?.originalPrice || null,
          discount_amount: effectivePriceBreakdown?.discountAmount || 0,
          final_price: effectivePriceBreakdown?.finalPrice || null,
        };

        const createdQueueEntry = await joinQueue(queuePayload as any);
        if (!createdQueueEntry || !createdQueueEntry.id) {
          throw new Error("Failed to join queue.");
        }

        toast.success("You have successfully joined the live queue!");
        setConfirmedQueueEntry({
          ...createdQueueEntry,
          estimatedServiceStartTime: createdQueueEntry.estimatedServiceStartTime || null,
          estimatedServiceEndTime: createdQueueEntry.estimatedServiceEndTime || null,
        });
        setQueueConfirmationDialogOpen(true);
        fetchQueueData();
      }
    } catch (err: any) {
      console.error("Booking submission error:", err);
      if (err?.code === "AUTH_REQUIRED") {
        router.push(`/auth?next=${encodeURIComponent(pathname || "/")}`);
        return;
      }
      if (err?.code === "PROFILE_INCOMPLETE") {
        router.push(`/profile?next=${encodeURIComponent(pathname || "/")}`);
        return;
      }
      toast.error(err.message || "Failed to complete booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading & Error States ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-slate-300 border-t-amber-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Loading Service &amp; Schedule...
          </p>
        </div>
      </div>
    );
  }

  if (error || !service || !company) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Icon icon="solar:danger-triangle-linear" className="w-6 h-6" />
          </div>
          <h2 className="font-serif font-bold text-xl text-slate-900 dark:text-white">
            Could not load service details
          </h2>
          <p className="text-xs text-slate-500">
            {error || "The requested service or provider is currently unavailable."}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Go Back
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-black cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const primaryPhoto = service.photo || service.service_photos?.[0]?.url || null;
  const ratingSummary = company.rating_summary;
  const averageStars = ratingSummary ? Number(ratingSummary.average_stars) : 4.9;
  const locationText = company.location_text?.split(",")?.[0]?.trim() || company.address?.split(",")?.[0]?.trim() || "Bole, Addis Ababa";
  const activeSpecialists = (service.providers || []).filter((p) => p.is_active);

  const isFinalStep = currentStepIndex === allSteps.length - 1;

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-slate-950 font-sans pb-16">
      {/* ── Breadcrumb ── */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-3">
        <BookingBreadcrumb company={company} serviceName={service.name} slug={company.slug} />
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-6">
        
        {/* ── 1. Top Service Summary Banner (Matching reference screenshot) ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Small square thumbnail matching image */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shrink-0 overflow-hidden flex items-center justify-center">
              {primaryPhoto ? (
                <Image
                  src={primaryPhoto}
                  alt={service.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="text-amber-600">
                  <Icon icon="solar:scissors-bold" className="w-7 h-7" />
                </div>
              )}
            </div>

            {/* Service Title & Info */}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-serif font-bold text-slate-900 dark:text-white truncate">
                {service.name}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{company.name}</span>
                {" "}·{" "}
                <span className="text-amber-500 font-bold">★ {averageStars.toFixed(1)}</span>
                {" "}·{" "}
                <span>{locationText}</span>
              </p>
              {currentStep !== "details" && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStepIndex(0);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-500 font-semibold inline-flex items-center gap-1 mt-1 cursor-pointer hover:underline"
                >
                  <span>View full details</span>
                  <Icon icon="solar:alt-arrow-right-linear" className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Big Price */}
          <div className="sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
            {effectivePriceBreakdown?.isCallForPrice ? (
              <span className="text-base sm:text-lg font-bold text-amber-600">Contact for price</span>
            ) : hasVariants && !selectedVariant ? (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-amber-600 font-bold block">
                  Starting from
                </span>
                <span className="text-2xl sm:text-3xl font-serif font-black text-slate-900 dark:text-white">
                  {startingPriceInfo.minPrice?.toFixed(0) || effectivePriceBreakdown?.originalPrice?.toFixed(0)} ETB
                </span>
              </div>
            ) : (
              <div>
                <div className="text-2xl sm:text-3xl font-serif font-black text-slate-900 dark:text-white">
                  {effectivePriceBreakdown?.finalPrice?.toFixed(0)} ETB
                </div>
                {effectivePriceBreakdown?.hasDiscount && (
                  <div className="text-xs text-slate-400 line-through">
                    was {effectivePriceBreakdown?.originalPrice?.toFixed(0)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── 2. Stepper Progress Bar (Details -> Option -> Specialist -> When -> Confirm) ── */}
        <div className="flex items-center justify-between max-w-2xl mx-auto px-2 py-2">
          {allSteps.map((step, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;
            const isClickable = idx < currentStepIndex;

            return (
              <React.Fragment key={step.key}>
                <button
                  type="button"
                  onClick={() => {
                    if (isClickable) {
                      setCurrentStepIndex(idx);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  disabled={!isClickable}
                  className={cn(
                    "flex items-center gap-2 group transition-all",
                    isClickable ? "cursor-pointer" : "cursor-default"
                  )}
                >
                  <span
                    className={cn(
                      "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                      isCurrent
                        ? "bg-[#0f2937] text-white shadow-xs scale-105"
                        : isCompleted
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-300 dark:border-slate-700 text-slate-400 bg-white dark:bg-slate-900"
                    )}
                  >
                    {isCompleted ? (
                      <Icon icon="akar-icons:check" className="w-3.5 h-3.5" />
                    ) : (
                      step.number
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-xs sm:text-sm transition-colors hidden sm:inline",
                      isCurrent
                        ? "text-slate-900 dark:text-white font-bold"
                        : isCompleted
                        ? "text-slate-700 dark:text-slate-300 font-medium"
                        : "text-slate-400 dark:text-slate-600 font-normal"
                    )}
                  >
                    {step.label}
                  </span>
                </button>

                {idx < allSteps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2 sm:mx-4 transition-colors",
                      idx < currentStepIndex ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── 3. Step Views Container ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs">
          
          {/* ════════════ STEP 1: SERVICE DETAILS & OVERVIEW ════════════ */}
          {currentStep === "details" && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  {service.is_package ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                      <Icon icon="solar:box-minimalistic-bold" className="w-3.5 h-3.5" />
                      <span>Package Deal</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                      <Icon icon="solar:check-circle-bold" className="w-3.5 h-3.5 text-teal-600" />
                      <span>Verified Service</span>
                    </span>
                  )}
                  {service.service_category?.name && (
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                      {service.service_category.name}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
                  {service.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Offered by <span className="font-semibold text-slate-800 dark:text-slate-200">{company.name}</span>
                </p>
              </div>

              {/* Photo Gallery Carousel */}
              {uniqueImageUrls.length > 0 && (
                <div className="relative">
                  <div
                    className="relative h-64 sm:h-80 md:h-[340px] w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer group border border-slate-200/80 dark:border-slate-700"
                    onMouseEnter={() => setIsAutoPlayPaused(true)}
                    onMouseLeave={() => setIsAutoPlayPaused(false)}
                    onClick={() => setSelectedLightboxImage(uniqueImageUrls[currentImageIndex])}
                  >
                    <Image
                      src={uniqueImageUrls[currentImageIndex]}
                      alt={service.name}
                      fill
                      className="object-cover group-hover:scale-102 transition-transform duration-500"
                      priority
                    />

                    {/* Watch Treatment Video Pill */}
                    {service.video_url && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsVideoModalOpen(true);
                        }}
                        className="absolute bottom-3 left-3 z-10 bg-[#0f2937]/90 hover:bg-[#0f2937] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border border-white/20 backdrop-blur-sm"
                      >
                        <Icon icon="solar:play-bold" className="w-3.5 h-3.5 text-amber-400" />
                        <span>Watch Treatment Video</span>
                      </button>
                    )}

                    {/* Image Counter */}
                    {uniqueImageUrls.length > 1 && (
                      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold py-1 px-2.5 rounded-full">
                        {currentImageIndex + 1} / {uniqueImageUrls.length}
                      </div>
                    )}

                    {/* Navigation Arrows */}
                    {uniqueImageUrls.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            prevImage();
                          }}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-xs transition-transform hover:scale-105 cursor-pointer"
                        >
                          <Icon icon="solar:alt-arrow-left-linear" className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            nextImage();
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-xs transition-transform hover:scale-105 cursor-pointer"
                        >
                          <Icon icon="solar:alt-arrow-right-linear" className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Strip */}
                  {uniqueImageUrls.length > 1 && (
                    <div
                      ref={thumbnailRef}
                      className="flex gap-2 overflow-x-auto no-scrollbar pt-2"
                    >
                      {uniqueImageUrls.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCurrentImageIndex(idx)}
                          className={cn(
                            "relative w-16 h-14 rounded-xl overflow-hidden shrink-0 border transition-all cursor-pointer",
                            idx === currentImageIndex
                              ? "border-[#0f2937] ring-2 ring-[#0f2937]/30"
                              : "border-slate-200 opacity-60 hover:opacity-100"
                          )}
                        >
                          <Image src={url} alt="thumbnail" fill className="object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Service Description Box */}
              {service.description && (
                <div className="bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <Icon icon="solar:document-text-bold" className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      About this Service &amp; Details
                    </h3>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line font-normal">
                    {service.description}
                  </div>
                </div>
              )}

              {/* Included Perks / Amenities */}
              {service.description_points && service.description_points.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Included Amenities:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {service.description_points.map((perk, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-900/50"
                      >
                        <Icon icon="akar-icons:check" className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{perk}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Curated Package Inclusions (If package) */}
              {service.is_package && service.package_items && service.package_items.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Icon icon="solar:layers-minimalistic-bold" className="w-4 h-4 text-amber-600" />
                    <span>Curated Package Inclusions:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {service.package_items.map((item, idx) => {
                      const isCustom = item.item_type === "custom" || !item.linked_service_id;
                      const title = isCustom ? item.custom_name : (item.linked_service?.name || item.custom_name || "Service");
                      const variantName = item.linked_variant?.name || item.service_variant?.name;
                      return (
                        <div
                          key={item.id || idx}
                          className="flex items-center gap-2.5 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800"
                        >
                          <Icon icon="akar-icons:check" className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {title}
                            </p>
                            {variantName && (
                              <p className="text-[11px] text-amber-600 font-medium">
                                {variantName}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5">
                  <span className="text-xs text-slate-400 block font-medium">Duration</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 block">
                    {service.estimated_wait_time_mins ? `${service.estimated_wait_time_mins} mins` : "Varies by option"}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5">
                  <span className="text-xs text-slate-400 block font-medium">Location</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 block truncate">
                    {locationText}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 col-span-2 sm:col-span-1">
                  <span className="text-xs text-slate-400 block font-medium">Live Queue Line</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 block">
                    {queueCount} {queueCount === 1 ? "person" : "people"} waiting
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ════════════ STEP 2: CHOOSE OPTION ════════════ */}
          {currentStep === "option" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
                  Choose your option
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Each option sets the price and how long your chair is held.
                </p>
              </div>

              {/* Radio Options List (Matching reference screenshot) */}
              <div className="space-y-3">
                {activeVariants.map((variant) => {
                  const isSelected = selectedVariantId === variant.id;
                  const vBreakdown = calculateItemPriceBreakdown(variant);

                  return (
                    <div
                      key={variant.id}
                      onClick={() => {
                        setSelectedVariantId(variant.id);
                        setSelectedSlot(null);
                      }}
                      className={cn(
                        "p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4",
                        isSelected
                          ? "border-2 border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 ring-2 ring-amber-500/20 shadow-xs"
                          : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Radio Circle */}
                        <span
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                            isSelected
                              ? "border-amber-500 bg-white dark:bg-slate-900"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                          )}
                        >
                          {isSelected && (
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                          )}
                        </span>

                        {/* Title & Duration */}
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                              {variant.name}
                            </h3>
                            {variant.duration_mins && (
                              <span className="text-xs text-slate-400 font-normal">
                                {variant.duration_mins} min
                              </span>
                            )}
                          </div>
                          {vBreakdown.hasDiscount && (
                            <span className="inline-block mt-1 text-[10px] font-extrabold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                              Save {vBreakdown.discountAmount.toFixed(0)} ETB
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price on right */}
                      <div className="text-right shrink-0">
                        {vBreakdown.isCallForPrice ? (
                          <span className="text-xs sm:text-sm font-bold text-amber-600">
                            Contact for price
                          </span>
                        ) : (
                          <div>
                            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                              {vBreakdown.finalPrice?.toFixed(0)} ETB
                            </div>
                            {vBreakdown.hasDiscount && (
                              <div className="text-xs text-amber-600/90 font-medium">
                                was {vBreakdown.originalPrice?.toFixed(0)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════════════ STEP 3: CHOOSE SPECIALIST ════════════ */}
          {currentStep === "specialist" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
                  Choose your specialist
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Choose who will take care of you, or pick the first available specialist for the fastest service.
                </p>
              </div>

              <div className="space-y-3">
                {/* 1. "Any Specialist" Card Featured */}
                <div
                  onClick={() => setSelectedProviderId(ANY_PROVIDER_ID)}
                  className={cn(
                    "p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4",
                    selectedProviderId === ANY_PROVIDER_ID
                      ? "border-2 border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 ring-2 ring-amber-500/20 shadow-xs"
                      : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                        selectedProviderId === ANY_PROVIDER_ID
                          ? "border-amber-500 bg-white dark:bg-slate-900"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                      )}
                    >
                      {selectedProviderId === ANY_PROVIDER_ID && (
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      )}
                    </span>

                    <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Icon icon="solar:users-group-rounded-bold" className="w-6 h-6" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                          Any Specialist (First Available)
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                          Fastest Service
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Shortest wait time · Paired with earliest open chair
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                      {queueCount} waiting
                    </span>
                  </div>
                </div>

                {/* 2. Individual Specialists */}
                {activeSpecialists.map((provider) => {
                  const isSelected = selectedProviderId === provider.id;
                  const pQueueCount = providerQueueCounts[provider.id] || 0;
                  const providerAvatar = (provider as any).avatar_url || (provider as any).photo;

                  return (
                    <div
                      key={provider.id}
                      onClick={() => setSelectedProviderId(provider.id)}
                      className={cn(
                        "p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4",
                        isSelected
                          ? "border-2 border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 ring-2 ring-amber-500/20 shadow-xs"
                          : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                            isSelected
                              ? "border-amber-500 bg-white dark:bg-slate-900"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                          )}
                        >
                          {isSelected && (
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                          )}
                        </span>

                        <div className="relative w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden flex items-center justify-center">
                          {providerAvatar ? (
                            <Image
                              src={providerAvatar}
                              alt={provider.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Icon icon="solar:user-bold" className="w-5 h-5 text-slate-400" />
                          )}
                        </div>

                        <div>
                          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                            {provider.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {provider.specialization || "Certified Specialist"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={cn(
                          "text-xs font-bold px-2.5 py-1 rounded-full",
                          pQueueCount > 0
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        )}>
                          {pQueueCount === 0 ? "Available now" : `${pQueueCount} in line`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════════════ STEP 4: WHEN (SCHEDULE VS LIVE QUEUE) ════════════ */}
          {currentStep === "when" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
                  When would you like your service?
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Schedule ahead of time or jump into today&apos;s live walk-in queue.
                </p>
              </div>

              {/* Mode Toggle Switcher */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBookingTab("appointment")}
                  className={cn(
                    "p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5",
                    bookingTab === "appointment"
                      ? "border-2 border-[#0f2937] dark:border-white bg-[#0f2937]/5 dark:bg-white/5 ring-2 ring-[#0f2937]/20"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                    <Icon icon="solar:calendar-bold" className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Schedule Appointment
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Choose date &amp; pick a time slot
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBookingTab("queue")}
                  className={cn(
                    "p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5",
                    bookingTab === "queue"
                      ? "border-2 border-[#0f2937] dark:border-white bg-[#0f2937]/5 dark:bg-white/5 ring-2 ring-[#0f2937]/20"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-600 flex items-center justify-center shrink-0">
                    <Icon icon="solar:bolt-circle-bold" className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Join Live Queue
                      </h4>
                      {queueCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-teal-500 text-white text-[10px] rounded-full font-bold">
                          {queueCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Walk in today &amp; wait virtually
                    </p>
                  </div>
                </button>
              </div>

              {/* Mode A: Appointment Scheduler */}
              {bookingTab === "appointment" && (
                <div className="pt-2">
                  <AppointmentScheduler
                    company={company}
                    selectedDate={selectedDate}
                    onDateSelect={(date) => {
                      setSelectedDate(date);
                      setSelectedSlot(null);
                    }}
                    slotsLoading={slotsLoading}
                    availableSlots={availableSlots}
                    onSlotClick={(slot) => setSelectedSlot(slot)}
                    isProviderSelected={Boolean(selectedProvider)}
                    selectedSlot={selectedSlot}
                  />
                </div>
              )}

              {/* Mode B: Live Queue Dashboard */}
              {bookingTab === "queue" && (
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        Live Walk-In Queue Status
                      </h3>
                      <p className="text-xs text-slate-500">
                        for <strong className="text-slate-800 dark:text-slate-200">{selectedProvider?.name}</strong>
                      </p>
                    </div>
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold",
                        isCompanyOpenToday
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      )}
                    >
                      {isCompanyOpenToday ? "Open Today" : "Closed Today"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                      <span className="text-xs text-slate-400 block font-medium">People in Line</span>
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 block">
                        {queueCount}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        {queueCount === 0 ? "No wait right now!" : "Currently in queue"}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                      <span className="text-xs text-slate-400 block font-medium">Estimated Start</span>
                      <span className="text-2xl sm:text-3xl font-black text-amber-600 mt-1 block">
                        {estimatedQueueStartTime ? format(estimatedQueueStartTime, "h:mm a") : "Immediate"}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        {estimatedQueueStartTime && isToday(estimatedQueueStartTime) ? "Estimated for today" : "Based on active times"}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                      <span className="text-xs text-slate-400 block font-medium">Treatment Duration</span>
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 block">
                        {effectiveService?.estimated_wait_time_mins || 30}m
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        {selectedVariant ? selectedVariant.name : "Standard time"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <Icon icon="solar:info-circle-bold" className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>You will receive an SMS and real-time live ticket updates on your phone after confirming.</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════ STEP 5: CUSTOMER DETAILS & CONFIRMATION ════════════ */}
          {currentStep === "confirm" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
                  Review &amp; Confirm Details
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Please review your booking summary and enter your contact details.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Booking Summary Card */}
                <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Booking Summary
                  </h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500">Service</span>
                      <span className="font-bold text-slate-900 dark:text-white text-right">
                        {service.name}
                      </span>
                    </div>

                    {selectedVariant && (
                      <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">Option</span>
                        <span className="font-bold text-amber-600 text-right">
                          {selectedVariant.name}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500">Specialist</span>
                      <span className="font-bold text-slate-900 dark:text-white text-right">
                        {selectedProvider?.name}
                      </span>
                    </div>

                    <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500">Mode</span>
                      <span className="font-bold text-slate-900 dark:text-white text-right">
                        {bookingTab === "appointment"
                          ? `📅 Appointment on ${selectedDate ? format(selectedDate, "MMM d") : ""}`
                          : "⚡ Live Walk-in Queue"}
                      </span>
                    </div>

                    {bookingTab === "appointment" && selectedSlot && (
                      <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">Time Slot</span>
                        <span className="font-bold text-emerald-600 text-right">
                          {selectedSlot.formattedTime}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between pt-2">
                      <span className="font-bold text-slate-900 dark:text-white">Total Amount</span>
                      <span className="font-black text-lg text-slate-900 dark:text-white text-right">
                        {effectivePriceBreakdown?.finalPrice?.toFixed(0)} ETB
                      </span>
                    </div>
                  </div>

                  {/* Prepayment Notice if required */}
                  {service.requires_prepayment && (service.prepayment_amount || 0) > 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                      <div className="font-bold flex items-center gap-1 mb-0.5">
                        <Icon icon="solar:card-2-bold" className="w-3.5 h-3.5" />
                        <span>Prepayment Deposit Required</span>
                      </div>
                      <p>
                        Deposit of {service.prepayment_amount} ETB is required to hold your reservation. You will upload proof right after clicking confirm.
                      </p>
                    </div>
                  )}
                </div>

                {/* Right: Contact Form */}
                <div className="lg:col-span-7 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Your Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Sara Abebe"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 0911223344"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      SMS confirmation &amp; live ticket updates will be sent to this number.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Special Requests / Notes (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="Any specific requests or requirements..."
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Action Navigation Footer (Inline at the end of each step) ── */}
          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left: Selected Summary */}
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Selected
              </span>
              <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                {selectedVariant?.name || service.name}
                {currentStepIndex >= (hasVariants ? 2 : 1) && selectedProvider && ` · ${selectedProvider.name}`}
              </div>
            </div>

            {/* Right: Navigation Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto w-full sm:w-auto justify-end">
              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-initial px-5 py-2.5 sm:py-3 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm transition-all cursor-pointer text-center"
                >
                  Back
                </button>
              )}

              <button
                type="button"
                onClick={handleNextStep}
                disabled={!canProceed || isSubmitting}
                className={cn(
                  "flex-1 sm:flex-initial px-7 sm:px-9 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs",
                  !canProceed || isSubmitting
                    ? "bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                    : "bg-[#0f2937] hover:bg-black active:scale-98"
                )}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : isFinalStep ? (
                  <span>
                    {service.requires_prepayment && (service.prepayment_amount || 0) > 0
                      ? "Proceed to Prepayment"
                      : bookingTab === "appointment"
                      ? "Confirm Appointment"
                      : "Confirm & Join Queue"}
                  </span>
                ) : currentStep === "details" ? (
                  <>
                    <span>{hasVariants ? "Choose Option" : "Choose Specialist"}</span>
                    <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Fullscreen Lightbox Modal for Photos ── */}
      <Dialog open={!!selectedLightboxImage} onOpenChange={() => setSelectedLightboxImage(null)}>
        <DialogContent className="max-w-4xl p-2 bg-black/95 border-none">
          <DialogTitle className="sr-only">{service.name} Gallery</DialogTitle>
          <DialogDescription className="sr-only">Full size image view</DialogDescription>
          {selectedLightboxImage && (
            <div className="relative w-full h-[70vh] flex items-center justify-center">
              <Image
                src={selectedLightboxImage}
                alt="Enlarged service"
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── 6. Treatment Video Modal if available ── */}
      {service.video_url && (
        <ServiceVideoModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          videoUrl={service.video_url}
          serviceName={service.name}
        />
      )}

      {/* ── 7. Verification & Confirmation Dialogs ── */}
      {selectedProvider && (
        <>
          <PaymentVerificationModal
            open={paymentVerificationModalOpen}
            onOpenChange={setPaymentVerificationModalOpen}
            booking={pendingBookingForPayment}
            service={service}
            company={company}
            selectedProvider={selectedProvider}
          />

          {confirmedQueueEntry && (
            <QueueConfirmationDialog
              open={queueConfirmationDialogOpen}
              onOpenChange={setQueueConfirmationDialogOpen}
              queueEntry={confirmedQueueEntry}
              service={service}
              company={company}
              selectedProvider={selectedProvider}
            />
          )}
        </>
      )}
    </div>
  );
}
