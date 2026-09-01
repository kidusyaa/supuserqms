"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import type {
  Service,
  Provider,
  Company,
  QueueItem,
  AvailableSlot,
  Booking,
} from "@/type";
import { ANY_PROVIDER_ID } from "@/type";
import {
  getServiceDetails,
  getCurrentQueueCount,
  getCompanyWorkingHours,
  getProviderOccupiedSlots,
  getLatestAvailableTimeForProvider,
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
import BookServiceDialog from "@/components/book/_componet/BookServiceDialog";
import PaymentVerificationModal from "@/components/book/_componet/PaymentVerificationModal";
import { JoinQueueDialog } from "@/components/book/_componet/JoinQueueDialog";
import { QueueConfirmationDialog } from "@/components/book/_componet/QueueConfirmationDialog";
import { toast } from "sonner";
import BookingBreadcrumb from "../_componets/BookingBreadcrumb";
import ServiceDetailsCard from "../_componets/ServiceDetailsCard";
import ProviderSelector from "../_componets/ProviderSelector";
import AppointmentScheduler from "../_componets/AppointmentScheduler";
import { cn } from "@/lib/utils";

interface ConfirmedQueueItem extends QueueItem {
  estimatedServiceStartTime?: Date | null;
  estimatedServiceEndTime?: Date | null;
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;

  // ── States ────────────────────────────────────────────────────────
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string>(ANY_PROVIDER_ID);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [bookingTab, setBookingTab] = useState<"appointment" | "queue">("appointment");

  // Dialogs
  const [joinQueueDialogOpen, setJoinQueueDialogOpen] = useState(false);
  const [bookServiceDialogOpen, setBookServiceDialogOpen] = useState(false);
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

  // Selected Provider Object
  const selectedProvider = useMemo(() => {
    if (!selectedProviderId) return undefined;

    if (selectedProviderId === ANY_PROVIDER_ID) {
      return {
        id: ANY_PROVIDER_ID,
        name: "Any Provider",
        specialization: "First available professional",
        is_active: true,
        company_id: company?.id || "",
        created_at: new Date().toISOString(),
        isAny: true,
      } as Provider;
    }
    return service?.providers?.find((p) => p.id === selectedProviderId);
  }, [service?.providers, selectedProviderId, company?.id]);

  // Open status check
  const isCompanyOpenToday = useMemo(() => {
    if (!company) return false;
    const todayHours = getCompanyWorkingHoursForDay(company, new Date());
    return todayHours !== null;
  }, [company]);

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
  }, [serviceId]);

  // ── Fetch Appointment Slots ───────────────────────────────────────
  useEffect(() => {
    if (!service || !company || !selectedDate || !selectedProvider || bookingTab !== "appointment") {
      setAvailableSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setSlotsLoading(true);
      try {
        const { start: dayStart, end: dayEnd } = getDayRange(selectedDate);

        if (selectedProviderId === ANY_PROVIDER_ID) {
          const activeProviders = (service.providers || []).filter((p) => p.is_active);
          if (activeProviders.length === 0) {
            setAvailableSlots([]);
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
              service,
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
            service,
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
  }, [service, company, selectedDate, selectedProviderId, bookingTab, selectedProvider]);

  // ── Fetch Live Queue & Estimates specifically for Selected Provider ─
  const fetchQueueData = useCallback(async () => {
    if (!service || !company || !selectedProvider) return;

    try {
      // 1. Fetch queue count for currently selected provider
      const count = await getCurrentQueueCount(service.id, selectedProviderId);
      setQueueCount(count);

      // 2. Fetch estimated queue start time for this provider
      const estimate = await getLatestAvailableTimeForProvider(
        company,
        selectedProviderId,
        service.id
      );
      setEstimatedQueueStartTime(estimate);

      // 3. Fetch individual provider queue counts for the selector badges
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

  // ── Action Handlers ────────────────────────────────────────────────
  const handleSlotClick = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setBookServiceDialogOpen(true);
  };

  const handleJoinQueueClick = () => {
    if (!selectedProvider) {
      toast.error("Please select a provider first.");
      return;
    }
    setJoinQueueDialogOpen(true);
  };

  const handleQueueJoined = (
    queueEntry: QueueItem,
    estimatedStartTime: Date | null
  ) => {
    setConfirmedQueueEntry({
      ...queueEntry,
      estimatedServiceStartTime: estimatedStartTime,
    });
    setQueueConfirmationDialogOpen(true);
    fetchQueueData();
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

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-slate-950 font-sans pb-16">
      {/* ── Breadcrumb ── */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-4">
        <BookingBreadcrumb company={company} serviceName={service.name} slug={company.slug} />
      </div>

      <div className="max-w-6xl mx-auto px-4 space-y-6">
        
        {/* ── 1. Clean Service Header Card ── */}
        <ServiceDetailsCard
          service={service}
          company={company}
          queueCount={queueCount}
          estimatedQueueStartTime={estimatedQueueStartTime}
          selectedProviderName={selectedProvider?.name}
        />

        {/* ── 2. Booking & Queue Action Section ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-8 space-y-7 shadow-none">
          
          {/* Top Bar: Title & Segmented Switcher */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
                Select Your Booking Option
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Choose a specialist and book a time slot or jump into the live queue
              </p>
            </div>

            {/* Segmented Switcher: [ 📅 Schedule Appointment | ⚡ Join Live Queue ] */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200/80 dark:border-slate-700/80 self-start md:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setBookingTab("appointment")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer",
                  bookingTab === "appointment"
                    ? "bg-[#0f2937] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Icon icon="solar:calendar-bold" className="w-3.5 h-3.5 text-amber-400" />
                <span>Schedule Appointment</span>
              </button>

              <button
                type="button"
                onClick={() => setBookingTab("queue")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer",
                  bookingTab === "queue"
                    ? "bg-[#0f2937] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Icon icon="solar:bolt-circle-bold" className="w-3.5 h-3.5 text-amber-400" />
                <span>Join Live Queue</span>
                {queueCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-teal-500 text-white text-[10px] rounded-full">
                    {queueCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Specialist / Provider Selector */}
          {service.is_package ? (
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Icon icon="solar:box-minimalistic-bold" className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Package Assignment
                </h4>
                <p className="text-xs text-slate-500">
                  This package will automatically be assigned to the first available professional specialist upon arrival.
                </p>
              </div>
            </div>
          ) : (
            <ProviderSelector
              providers={service.providers || []}
              selectedProviderId={selectedProviderId}
              onSelectProvider={(id) => {
                setSelectedProviderId(id);
                setSelectedSlot(null);
              }}
              queueCountsByProvider={providerQueueCounts}
            />
          )}

          {/* ── Content depending on Selected Tab ── */}
          {bookingTab === "appointment" ? (
            /* Tab 1: Interactive Appointment Scheduler */
            <div className="pt-2">
              <AppointmentScheduler
                company={company}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                slotsLoading={slotsLoading}
                availableSlots={availableSlots}
                onSlotClick={handleSlotClick}
                isProviderSelected={!!selectedProvider}
              />
            </div>
          ) : (
            /* Tab 2: Live Walk-In Queue */
            <div className="pt-2">
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6">
                
                {/* Live Badge & Open Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                      <span>Live Queue Active</span>
                    </span>
                    <span className="text-xs text-slate-400">
                      for <strong className="text-slate-700 dark:text-slate-300">{selectedProvider?.name}</strong>
                    </span>
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

                {/* Queue Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Position in line */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                      <Icon icon="solar:users-group-rounded-linear" className="w-4 h-4 text-slate-500" />
                      <span>People in Line</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      {queueCount}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {queueCount === 0 ? "No wait right now!" : "Currently in queue"}
                    </p>
                  </div>

                  {/* Estimated start time */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                      <Icon icon="solar:clock-circle-linear" className="w-4 h-4 text-slate-500" />
                      <span>Estimated Service Start</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                      {estimatedQueueStartTime ? format(estimatedQueueStartTime, "h:mm a") : "Immediate"}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {estimatedQueueStartTime && isToday(estimatedQueueStartTime) ? "Estimated for today" : "Based on active wait times"}
                    </p>
                  </div>

                  {/* Service Duration */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                      <Icon icon="solar:stopwatch-linear" className="w-4 h-4 text-slate-500" />
                      <span>Service Duration</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      {service.estimated_wait_time_mins || 30}m
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Standard treatment time
                    </p>
                  </div>
                </div>

                {/* Join Queue CTA Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleJoinQueueClick}
                    disabled={!isCompanyOpenToday}
                    className={cn(
                      "w-full py-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-none",
                      !isCompanyOpenToday
                        ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300"
                        : "bg-[#0f2937] hover:bg-black text-white active:scale-99 border border-[#0f2937]"
                    )}
                  >
                    <Icon icon="solar:bolt-circle-bold" className="w-5 h-5 text-amber-400" />
                    <span>
                      {!isCompanyOpenToday
                        ? "Salon Closed Today"
                        : `Join Live Queue with ${selectedProvider?.name || "Specialist"}`}
                    </span>
                  </button>

                  <p className="text-center text-[11px] text-slate-400 mt-2.5">
                    * You will receive a live ticket number and real-time wait updates on your profile.
                  </p>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Dialogs ── */}
      {selectedProvider && (
        <>
          <BookServiceDialog
            open={bookServiceDialogOpen}
            onOpenChange={setBookServiceDialogOpen}
            service={service}
            company={company}
            selectedProvider={selectedProvider}
            selectedSlot={selectedSlot}
            onPrepaymentRequired={(createdBooking) => {
              setPendingBookingForPayment(createdBooking);
              setPaymentVerificationModalOpen(true);
            }}
          />

          <PaymentVerificationModal
            open={paymentVerificationModalOpen}
            onOpenChange={setPaymentVerificationModalOpen}
            booking={pendingBookingForPayment}
            service={service}
            company={company}
            selectedProvider={selectedProvider}
          />

          <JoinQueueDialog
            open={joinQueueDialogOpen}
            onOpenChange={setJoinQueueDialogOpen}
            service={service}
            company={company}
            selectedProvider={selectedProvider}
            currentQueueCount={queueCount}
            estimatedQueueStartTime={estimatedQueueStartTime}
            onQueueJoined={handleQueueJoined}
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