"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type {
  Service,
  Provider,
  Company,
  Booking,
  QueueItem,
  AvailableSlot,
} from "@/type";
import {
  getServiceDetails,
  getConfirmedBookingsForProvider,
  getCurrentQueueCount,
  getActiveQueueEntriesForProvider,
} from "@/lib/supabase-utils";
import { getCompanyWorkingHoursForDay } from "@/lib/booking-utils";
import {
  getCompanyWorkingHours,
  getProviderOccupiedSlots,
  getLatestAvailableTimeForProvider,
} from "@/lib/supabase-utils";
import {
  startOfDay,
  endOfDay,
  max,
  isBefore,
  isAfter,
  addMinutes,
  format,
} from "date-fns";
import { generateAvailableSlots, getDayRange } from "@/lib/booking-utils";
import BookServiceDialog from "@/components/book/_componet/BookServiceDialog";
import { JoinQueueDialog } from "@/components/book/_componet/JoinQueueDialog";
// NEW: Import the new QueueConfirmationDialog
import { QueueConfirmationDialog } from "@/components/book/_componet/QueueConfirmationDialog"; // We'll create this next
import { toast } from "sonner";

// Import the new components
import BookingBreadcrumb from "../_componets/BookingBreadcrumb";
import ServiceDetailsCard from "../_componets/ServiceDetailsCard";
import ProviderSelector from "../_componets/ProviderSelector";
import AppointmentScheduler from "../_componets/AppointmentScheduler";

// Define UI modes for conditional rendering
type UiMode = "initial" | "scheduleAppointment";

// Extend QueueItem to include the estimatedStartTime which might not be persisted directly
interface ConfirmedQueueItem extends QueueItem {
  estimatedServiceStartTime?: Date | null;
  estimatedServiceEndTime?: Date | null; // NEW: Added end time for more complete display
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for UI interaction
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    startOfDay(new Date())
  );
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [joinQueueDialogOpen, setJoinQueueDialogOpen] = useState(false);
  const [bookServiceDialogOpen, setBookServiceDialogOpen] = useState(false);
  // NEW: State for the queue confirmation dialog
  const [queueConfirmationDialogOpen, setQueueConfirmationDialogOpen] =
    useState(false);
  const [confirmedQueueEntry, setConfirmedQueueEntry] =
    useState<ConfirmedQueueItem | null>(null);

  // State to control the display mode
  const [uiMode, setUiMode] = useState<UiMode>("initial");

  // State for data derived from selections
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [estimatedQueueStartTime, setEstimatedQueueStartTime] =
    useState<Date | null>(null); // This is the estimate *for the next person*

  const serviceId = params.serviceId as string;

  const company = useMemo(() => service?.company, [service]);
  const selectedProvider = useMemo(
    () => service?.providers?.find((p) => p.id === selectedProviderId),
    [service?.providers, selectedProviderId]
  );

  const isCompanyOpenToday = useMemo(() => {
    if (!company) return false;
    // Check for today's hours. We only care if it returns a value or null.
    const todayHours = getCompanyWorkingHoursForDay(company, new Date());
    return todayHours !== null;
  }, [company]);

  // Effect 1: Fetch initial service data
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
        if (!data || !data.company)
          throw new Error("Service or company not found.");
        setService(data);
        const activeProvider = data.providers?.find((p) => p.is_active);
        if (activeProvider) setSelectedProviderId(activeProvider.id);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchServiceData();
  }, [serviceId]);

  // Effect 2: Fetch slots when dependencies change
  useEffect(() => {
    if (!selectedProvider) {
      setUiMode("initial");
    }
    if (!service || !company || !selectedDate || !selectedProvider) {
      setAvailableSlots([]);
      return;
    }
    const fetchSlots = async () => {
      setSlotsLoading(true);
      try {
        const { start: dayStart, end: dayEnd } = getDayRange(selectedDate); // Get the full day range

        // NEW: Fetch ALL occupied slots for the provider for the selected day
        const occupiedSlots = await getProviderOccupiedSlots(
          selectedProvider.id,
          dayStart,
          dayEnd
        );

        // Pass the combined occupied slots to generateAvailableSlots
        // IMPORTANT: Ensure generateAvailableSlots can handle this new format.
        // It should expect objects with start_time and end_time (strings).
        const slots = generateAvailableSlots(
          company,
          service,
          selectedProvider,
          selectedDate,
          occupiedSlots
        );
        setAvailableSlots(slots);
      } catch (err) {
        toast.error("Failed to load available slots.");
        setAvailableSlots([]);
        console.error("Error fetching slots:", err);
      } finally {
        setSlotsLoading(false);
      }
    };
    if (uiMode === "scheduleAppointment") {
      fetchSlots();
    } else {
      setAvailableSlots([]); // Clear slots if not in schedule mode
    }
  }, [service, company, selectedDate, selectedProviderId, uiMode]);

  // Effect 3: Fetch queue data and estimate start time (with polling)
  useEffect(() => {
    if (!service || !company || !selectedProvider) return;

    const fetchQueueData = async () => {
      try {
        const count = await getCurrentQueueCount(service.id);
        setQueueCount(count);

        // NEW: Use getLatestAvailableTimeForProvider from backend for a more accurate estimate
        // This will consider company hours and existing reservations.
        const estimate = await getLatestAvailableTimeForProvider(
          company,
          selectedProvider.id,
          service.id
        );
        setEstimatedQueueStartTime(estimate);
      } catch (err) {
        toast.error("Failed to get queue information.");
        console.error("Error fetching queue data:", err);
        setEstimatedQueueStartTime(null); // Clear estimate on error
      }
    };

    fetchQueueData();
    const interval = setInterval(fetchQueueData, 30000);
    return () => clearInterval(interval);
  }, [service, company, selectedProviderId]);

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

  const handleScheduleAppointmentClick = () => {
    if (!selectedProvider) {
      toast.error("Please select a provider first.");
      return;
    }
    setUiMode("scheduleAppointment");
  };

  // NEW: Callback function for when queue is successfully joined
  const handleQueueJoined = (
    queueEntry: QueueItem,
    estimatedStartTime: Date | null
  ) => {
    setConfirmedQueueEntry({
      ...queueEntry,
      estimatedServiceStartTime: estimatedStartTime, // Augment with the calculated estimate
    });
    setQueueConfirmationDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !service || !company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center">
        <div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-muted-foreground mb-4">
            {error || "Could not load service details."}
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BookingBreadcrumb company={company} serviceName={service.name} slug={company.slug} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <ServiceDetailsCard
            service={service}
            company={company}
            queueCount={queueCount}
            estimatedQueueStartTime={estimatedQueueStartTime} // This is the estimate for the *next* person
          />

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Select a Provider & Action</CardTitle>
              <CardDescription>
                First, choose your preferred provider, then decide to schedule
                or join the queue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <ProviderSelector
                  providers={service.providers || []}
                  selectedProviderId={selectedProviderId}
                  onSelectProvider={(id) => {
                    setSelectedProviderId(id);
                    setUiMode("initial");
                    setSelectedSlot(null);
                  }}
                />

                {!selectedProvider ? (
                  <p className="text-center text-muted-foreground mt-4">
                    Please select a provider to see booking options.
                  </p>
                ) : (
                  <>
                    {uiMode === "initial" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <Button
                          size="lg"
                          onClick={handleScheduleAppointmentClick}
                          disabled={!selectedProvider}
                        >
                          Schedule an Appointment
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={handleJoinQueueClick}
                          // UPDATE THIS LINE: Disable if provider not selected OR if company is closed today
                          disabled={!selectedProvider || !isCompanyOpenToday}
                        >
                          Join Queue ({queueCount} in line)
                        </Button>

                        {!isCompanyOpenToday && selectedProvider && (
                          <p className="text-center text-sm text-red-500 mt-2">
                            The company is closed today. Please schedule an
                            appointment for a future date.
                          </p>
                        )}
                      </div>
                    )}

                    {uiMode === "scheduleAppointment" && (
                      <>
                        <AppointmentScheduler
                          company={company}
                          selectedDate={selectedDate}
                          onDateSelect={setSelectedDate}
                          slotsLoading={slotsLoading}
                          availableSlots={availableSlots}
                          onSlotClick={handleSlotClick}
                          isProviderSelected={!!selectedProvider}
                        />
                        <div className="mt-6 text-center">
                          <Button
                            variant="outline"
                            onClick={() => setUiMode("initial")}
                          >
                            &larr; Back to Options
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Booking Dialog */}
      {selectedProvider && (
        <BookServiceDialog
          open={bookServiceDialogOpen}
          onOpenChange={setBookServiceDialogOpen}
          service={service}
          company={company}
          selectedProvider={selectedProvider}
          selectedSlot={selectedSlot}
        />
      )}

      {/* Join Queue Dialog */}
      {selectedProvider && (
        <JoinQueueDialog
          open={joinQueueDialogOpen}
          onOpenChange={setJoinQueueDialogOpen}
          service={service}
          company={company}
          selectedProvider={selectedProvider}
          currentQueueCount={queueCount}
          estimatedQueueStartTime={estimatedQueueStartTime} // This is the estimate for the *next* person
          onQueueJoined={handleQueueJoined} // NEW: Pass the callback
        />
      )}

      {/* NEW: Queue Confirmation Dialog */}
      {selectedProvider && confirmedQueueEntry && (
        <QueueConfirmationDialog
          open={queueConfirmationDialogOpen}
          onOpenChange={setQueueConfirmationDialogOpen}
          queueEntry={confirmedQueueEntry}
          service={service} // Pass service, company, provider for robust display
          company={company}
          selectedProvider={selectedProvider}
        />
      )}
    </div>
  );
}
