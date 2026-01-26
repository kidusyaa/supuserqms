// src/app/book/[serviceId]/page.tsx - Updated with better UI
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
import { QueueConfirmationDialog } from "@/components/book/_componet/QueueConfirmationDialog";
import { toast } from "sonner";
import { Calendar, Clock, Users, CheckCircle, ArrowLeft } from "lucide-react";

// Import the new components
import BookingBreadcrumb from "../_componets/BookingBreadcrumb";
import ServiceDetailsCard from "../_componets/ServiceDetailsCard";
import ProviderSelector from "../_componets/ProviderSelector";
import AppointmentScheduler from "../_componets/AppointmentScheduler";

// Define UI modes for conditional rendering
type UiMode = "initial" | "scheduleAppointment";

// Extend QueueItem to include the estimatedStartTime
interface ConfirmedQueueItem extends QueueItem {
  estimatedServiceStartTime?: Date | null;
  estimatedServiceEndTime?: Date | null;
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
  const [queueConfirmationDialogOpen, setQueueConfirmationDialogOpen] = useState(false);
  const [confirmedQueueEntry, setConfirmedQueueEntry] = useState<ConfirmedQueueItem | null>(null);
  const [uiMode, setUiMode] = useState<UiMode>("initial");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [estimatedQueueStartTime, setEstimatedQueueStartTime] = useState<Date | null>(null);

  const serviceId = params.serviceId as string;

  const company = useMemo(() => service?.company, [service]);
  const selectedProvider = useMemo(
    () => service?.providers?.find((p) => p.id === selectedProviderId),
    [service?.providers, selectedProviderId]
  );

  const isCompanyOpenToday = useMemo(() => {
    if (!company) return false;
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
        const { start: dayStart, end: dayEnd } = getDayRange(selectedDate);
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
      setAvailableSlots([]);
    }
  }, [service, company, selectedDate, selectedProviderId, uiMode]);

  // Effect 3: Fetch queue data and estimate start time
  useEffect(() => {
    if (!service || !company || !selectedProvider) return;

    const fetchQueueData = async () => {
      try {
        const count = await getCurrentQueueCount(service.id);
        setQueueCount(count);
        const estimate = await getLatestAvailableTimeForProvider(
          company,
          selectedProvider.id,
          service.id
        );
        setEstimatedQueueStartTime(estimate);
      } catch (err) {
        toast.error("Failed to get queue information.");
        console.error("Error fetching queue data:", err);
        setEstimatedQueueStartTime(null);
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

  const handleQueueJoined = (
    queueEntry: QueueItem,
    estimatedStartTime: Date | null
  ) => {
    setConfirmedQueueEntry({
      ...queueEntry,
      estimatedServiceStartTime: estimatedStartTime,
    });
    setQueueConfirmationDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Clock className="h-6 w-6 text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-gray-600 font-medium">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (error || !service || !company) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl border-red-100">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
             x
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              {error || "Could not load service details."}
            </p>
            <div className="space-y-3">
              <Button onClick={() => router.back()} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-6">
        <BookingBreadcrumb company={company} serviceName={service.name} slug={company.slug} />
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          <ServiceDetailsCard
            service={service}
            company={company}
            queueCount={queueCount}
            estimatedQueueStartTime={estimatedQueueStartTime}
          />

          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Book Your Appointment
                  </CardTitle>
                  <CardDescription className="text-gray-600 mt-2">
                    Choose your preferred provider and booking method
                  </CardDescription>
                </div>
                {selectedProvider && uiMode === "initial" && (
                  <div className="flex items-center gap-2 text-sm bg-blue-50 text-tertiary px-3 py-2 rounded-lg">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Provider selected: {selectedProvider.name}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-8">
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
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">
                    Please select a provider to continue with booking
                  </p>
                </div>
              ) : (
                <>
                  {uiMode === "initial" && (
                    <div className="space-y-6">
                      <div className="text-center mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          How would you like to book?
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Schedule Appointment Card */}
                        <div className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 hover:border-primary/50 bg-white p-6 transition-all duration-300 hover:shadow-2xl">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                          <div className="relative">
                            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                              <Calendar className="h-7 w-7 text-primary" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-3">
                              Schedule Appointment
                            </h4>
                            <p className="text-gray-600 mb-6">
                              Choose a specific date and time that works best for you
                            </p>
                            <Button
                              onClick={handleScheduleAppointmentClick}
                              size="lg"
                              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white"
                            >
                              Select Date & Time
                            </Button>
                          </div>
                        </div>

                        {/* Join Queue Card */}
                        <div className={`group relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-300 ${
                          !isCompanyOpenToday 
                            ? 'border-gray-200 bg-gray-50 opacity-75 cursor-not-allowed' 
                            : 'border-gray-200 hover:border-blue-500/50 bg-white hover:shadow-2xl'
                        }`}>
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                          <div className="relative">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ${
                              !isCompanyOpenToday ? 'bg-gray-100' : 'bg-blue-500/10'
                            }`}>
                              <Clock className={`h-7 w-7 ${!isCompanyOpenToday ? 'text-gray-400' : 'text-tertiary/80'}`} />
                            </div>
                            <div className="flex items-center gap-3 mb-3">
                              <h4 className="text-xl font-bold text-gray-900">
                                Join Queue
                              </h4>
                              <span className="px-3 py-1 bg-blue-100 text-tertiary/80 text-sm font-medium rounded-full">
                                {queueCount} in line
                              </span>
                            </div>
                            <p className="text-gray-600 mb-6">
                              Get in line and be served as soon as possible
                            </p>
                            <Button
                              onClick={handleJoinQueueClick}
                              size="lg"
                              disabled={!isCompanyOpenToday}
                              className={`w-full ${
                                !isCompanyOpenToday 
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                  : 'bg-gradient-to-r from-tertiary to-tertiary/50 hover:from-tertiary/80 hover:to-tertiary/80 text-white border-tertiary/80'
                              }`}
                            >
                              {!isCompanyOpenToday ? 'Closed Today' : 'Join Queue Now'}
                            </Button>
                          </div>
                          
                          {!isCompanyOpenToday && (
                            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                              <p className="text-sm text-amber-700">
                                Company is closed today. Please schedule an appointment for a future date.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-center pt-6 border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                          Need help deciding? <a href="#" className="text-primary hover:underline font-medium">Contact support</a>
                        </p>
                      </div>
                    </div>
                  )}

                  {uiMode === "scheduleAppointment" && (
                    <>
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">Select Appointment Time</h3>
                            <p className="text-gray-600">Choose a date and time for your appointment</p>
                          </div>
                          <Button
                            variant="ghost"
                            onClick={() => setUiMode("initial")}
                            className="gap-2"
                          >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Options
                          </Button>
                        </div>
                        
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

                      <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-xl p-6 border border-primary/10">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <CheckCircle className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Why schedule an appointment?</h4>
                            <ul className="space-y-2 text-gray-600">
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                                <span>Guaranteed time slot for your service</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                                <span>No waiting in queues</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                                <span>Flexibility to choose your preferred time</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      {selectedProvider && (
        <>
          <BookServiceDialog
            open={bookServiceDialogOpen}
            onOpenChange={setBookServiceDialogOpen}
            service={service}
            company={company}
            selectedProvider={selectedProvider}
            selectedSlot={selectedSlot}
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