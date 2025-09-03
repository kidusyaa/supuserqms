// src/app/services/[id]/book/_componet/BookServiceDialog.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { Dialog, DialogContent,DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@iconify/react";
import { generateTimeSlots } from "@/lib/time-utils";
import { Service, Company, Provider } from "@/type";
import { createQueueEntry, CreateQueuePayload } from "@/lib/supabase-utils"; 

// Country codes data (unchanged)
const countryCodes = [
  { code: "+251", country: "Ethiopia", flag: "🇪🇹" },
  { code: "+1", country: "United States", flag: "🇺🇸" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
];

interface BookServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
  company: Company;
  selectedProvider: Provider;
}

export default function BookServiceDialog({ open, onOpenChange, service, company, selectedProvider }: BookServiceDialogProps) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [userName, setUserName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+251");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const timeSlots = useMemo(() => {
    // Provide sensible defaults if company.working_hours or service.estimated_wait_time_mins are null
    const effectiveWorkingHours = company.working_hours || "09:00-17:00"; // Default to a standard 9-5
    const effectiveServiceDuration = service.estimated_wait_time_mins || 30; // Default to 30 mins
    return generateTimeSlots(effectiveWorkingHours, effectiveServiceDuration);
  }, [company.working_hours, service.estimated_wait_time_mins]);

  const handleBook = async () => {
    if (!date || !time || !userName || !phoneNumber) {
      setError("Please fill in all required fields.");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      // Ensure time is in HH:MM format, then append :00 for seconds
      const appointmentDateTime = `${date}T${time}:00`; 

      const fullPhoneNumber = countryCode + phoneNumber;
      const queueData: CreateQueuePayload = {
        user_name: userName,
        phone_number: fullPhoneNumber,
        service_id: service.id,
        provider_id: selectedProvider.id,
        queue_type: "booking",
        appointment_time: appointmentDateTime, // Pass the scheduled time
        notes: `Booking for ${service.name} on ${date} at ${time}`,
      };

      await createQueueEntry(queueData);

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard"); // Redirect to a user dashboard or bookings page
      }, 2000);

    } catch (e: any) {
      console.error("Booking failed:", e);
      setError(e.message || "Failed to book the appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      // Reset form on close
      setSuccess(false);
      setError("");
      setLoading(false);
      setDate("");
      setTime("");
      setUserName("");
      setPhoneNumber("");
      setCountryCode("+251");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Schedule Appointment</DialogTitle>
          <DialogDescription>
            Fill in the details below to book your time slot for <strong>{service.name}</strong> with <strong>{selectedProvider.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        {success ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Icon icon="lucide:check-circle-2" className="w-16 h-16 text-green-400 mb-4" />
            <h3 className="text-xl font-bold text-slate-800">Booking Confirmed!</h3>
            <p className="text-slate-600 mt-2">Your appointment for {service.name} is scheduled for {date} at {time}.</p>
            <p className="text-slate-600 mt-2">Redirecting you to your dashboard...</p>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="date">Select Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="time">Select Time</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger id="time" className="w-full">
                  <SelectValue placeholder="Select an available time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.length > 0 ? (
                    timeSlots.map((slot) => (<SelectItem key={slot} value={slot}>{slot}</SelectItem>))
                  ) : (
                    <SelectItem value="no-slots" disabled>No time slots available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="userName">Your Name</Label>
              <Input id="userName" placeholder="Your Name" value={userName} onChange={(e) => setUserName(e.target.value)} />
            </div>
            
            <div>
              <Label htmlFor="phoneNumberInput">Phone Number</Label>
              <div className="flex gap-2">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countryCodes.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <span className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          <span>{country.code}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input 
                  id="phoneNumberInput"
                  className="flex-1" 
                  placeholder="912345678" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)} 
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                className="w-full bg-blue-900 text-white font-bold py-3 rounded-lg disabled:bg-slate-400 hover:bg-blue-800 transition-colors"
                onClick={handleBook}
                disabled={loading || !date || !time || !userName || !phoneNumber}
              >
                {loading ? "Booking..." : "Confirm Booking"}
              </Button>
            </DialogFooter>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}