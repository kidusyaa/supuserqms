"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Service, Provider, Company, Booking, QueueItem, AvailableSlot } from "@/type";
import { getServiceDetails, getConfirmedBookingsForProvider, getCurrentQueueCount, getActiveQueueEntriesForProvider } from "@/lib/supabase-utils";
import { generateAvailableSlots, getDayRange, calculateEstimatedQueueStartTime } from "@/lib/booking-utils";
import BookServiceDialog from "@/components/book/_componet/BookServiceDialog";
import { JoinQueueDialog } from "@/components/book/_componet/JoinQueueDialog";
import { startOfDay } from "date-fns";
import { toast } from "sonner";

// Import the new components
import BookingConfirmationPage from "../confirmation/page";
import BookingBreadcrumb from "../_compnets/BookingBreadcrumb";
import ServiceDetailsCard from "../_compnets/ServiceDetailsCard";
import ProviderSelector from "../_compnets/ProviderSelector";
import AppointmentScheduler from "../_compnets/AppointmentScheduler";
import ActionButtons from "../_compnets/ActionButtons";

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for UI interaction
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [joinQueueDialogOpen, setJoinQueueDialogOpen] = useState(false);
  const [bookServiceDialogOpen, setBookServiceDialogOpen] = useState(false);

  // State for data derived from selections
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [estimatedQueueStartTime, setEstimatedQueueStartTime] = useState<Date | null>(null);

  const serviceId = params.serviceId as string;

  const company = useMemo(() => service?.company, [service]);
  const selectedProvider = useMemo(() => service?.providers?.find((p) => p.id === selectedProviderId), [service?.providers, selectedProviderId]);

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
        if (!data || !data.company) throw new Error("Service or company not found.");
        setService(data);
        const activeProvider = data.providers?.find(p => p.is_active);
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
    if (!service || !company || !selectedDate || !selectedProvider) {
      setAvailableSlots([]);
      return;
    }
    const fetchSlots = async () => {
      setSlotsLoading(true);
      try {
        const { start, end } = getDayRange(selectedDate);
        const bookings = await getConfirmedBookingsForProvider(selectedProvider.id, start, end);
        const slots = generateAvailableSlots(company, service, selectedProvider, selectedDate, bookings);
        setAvailableSlots(slots);
      } catch (err) {
        toast.error("Failed to load available slots.");
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [service, company, selectedDate, selectedProvider]);

  // Effect 3: Fetch queue data and estimate start time (with polling)
  useEffect(() => {
    if (!service || !company || !selectedProvider) return;

    const fetchQueueData = async () => {
      try {
        const count = await getCurrentQueueCount(service.id);
        setQueueCount(count);
        const activeEntries = await getActiveQueueEntriesForProvider(service.id, selectedProvider.id);
        const { start, end } = getDayRange(new Date());
        const todaysBookings = await getConfirmedBookingsForProvider(selectedProvider.id, start, end);
        const estimate = calculateEstimatedQueueStartTime(company, service, selectedProvider, todaysBookings, activeEntries);
        setEstimatedQueueStartTime(estimate);
      } catch (err) {
        toast.error("Failed to get queue information.");
      }
    };

    fetchQueueData();
    const interval = setInterval(fetchQueueData, 30000);
    return () => clearInterval(interval);
  }, [service, company, selectedProvider]);

  const handleSlotClick = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setBookServiceDialogOpen(true);
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
          <p className="text-muted-foreground mb-4">{error || "Could not load service details."}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BookingBreadcrumb company={company} serviceName={service.name} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <ServiceDetailsCard
            service={service}
            company={company}
            queueCount={queueCount}
            estimatedQueueStartTime={estimatedQueueStartTime}
          />

          <Card>
            <CardHeader>
              <CardTitle>Book Your Service</CardTitle>
              <CardDescription>Choose your preferred provider and available slot</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <ProviderSelector
                  providers={service.providers || []}
                  selectedProviderId={selectedProviderId}
                  onSelectProvider={setSelectedProviderId}
                />
                <AppointmentScheduler
                  company={company}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  slotsLoading={slotsLoading}
                  availableSlots={availableSlots}
                  onSlotClick={handleSlotClick}
                  isProviderSelected={!!selectedProvider}
                />
                <ActionButtons
                  onJoinQueue={() => setJoinQueueDialogOpen(true)}
                  isJoinQueueDisabled={!selectedProvider}
                  queueCount={queueCount}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs remain controlled by the main page state */}
      {selectedProvider && (
        <>
          <JoinQueueDialog
            open={joinQueueDialogOpen}
            onOpenChange={setJoinQueueDialogOpen}
            service={service}
            company={company}
            selectedProvider={selectedProvider}
            currentQueueCount={queueCount}
            estimatedQueueStartTime={estimatedQueueStartTime}
          />
          <BookServiceDialog
            open={bookServiceDialogOpen}
            onOpenChange={setBookServiceDialogOpen}
            service={service}
            company={company}
            selectedProvider={selectedProvider}
            selectedSlot={selectedSlot}
          />
        </>
      )}
    </div>
  );
}