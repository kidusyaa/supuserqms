"use client";

import { useState, useEffect, useMemo } from "react"; // <-- Import useMemo
import { useRouter } from "next/navigation";

import { Dialog, DialogContent,DialogHeader, DialogTitle, DialogDescription /* ... other dialog imports */ } from "@/components/ui/dialog";
import { Icon } from "@iconify/react";
import { generateTimeSlots } from "@/lib/time-utils"; // <-- Import our new utility
import { Service, Company, Provider,QueueItem } from "@/type"; // <-- Import types
import { createQueueEntry, CreateQueuePayload } from "@/lib/supabase-utils"; 
// --- Updated props interface ---
interface BookServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
  company: Company;
  selectedProvider: Provider;
}

export default function BookServiceDialog({ open, onOpenChange, service, company, selectedProvider }: BookServiceDialogProps) {
  const router = useRouter();
  const [date, setDate] = useState(""); // This can be your dual-calendar state later
  const [time, setTime] = useState("");
  const [userName, setUserName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // --- DYNAMICALLY GENERATE TIME SLOTS ---
   const timeSlots = useMemo(() => {
    // This now calls the powerful function and will succeed
    return generateTimeSlots(company.working_hours, service.estimated_wait_time_mins);
  }, [company.working_hours, service.estimated_wait_time_mins]);
  // --- BOOKING LOGIC ---
  const handleBook = async () => {
    // ... your validation is fine ...
    setLoading(true);
    setError("");
    try {
      // --- THE FIX: Construct the payload for our new function ---
      // Combine date and time into a single ISO string for the database
      const appointmentDateTime = new Date(`${date}T${time}`);

      const queueData: CreateQueuePayload = {
        user_name: userName,
        phone_number: phoneNumber,
        service_id: service.id,
        provider_id: selectedProvider.id,
        queue_type: "booking", // This is for a scheduled appointment
        notes: `Booking for ${date} at ${time}`,
      };

      // --- THE FIX: Call the new Supabase API function ---
      await createQueueEntry(queueData);

      setSuccess(true);
      setTimeout(() => {
        router.push("/services"); // Redirect
      }, 2000);

    } catch (e) {
      console.error("Booking failed:", e);
      setError("Failed to book the appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      // Reset form
      setSuccess(false);
      setError("");
      setLoading(false);
      setDate("");
      setTime("");
    }
  }, [open]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Schedule Appointment</DialogTitle>
          <DialogDescription>
            Fill in the details below to book your time slot.
          </DialogDescription>
        </DialogHeader>
        
        {success ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Icon icon="lucide:check-circle-2" className="w-16 h-16 text-green-400 mb-4" />
            <h3 className="text-xl font-bold text-slate-800">Booking Confirmed!</h3>
            <p className="text-slate-600 mt-2">Redirecting you to your dashboard...</p>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            <div>
              <label className="block mb-1 font-medium text-sm text-slate-600">Select Date</label>
              <input type="date" className="w-full border p-2 rounded" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="block mb-1 font-medium text-sm text-slate-600">Select Time</label>
              <select className="w-full border p-2 rounded" value={time} onChange={(e) => setTime(e.target.value)}>
                <option value="">Select an available time</option>
                {/* --- The options are now dynamic --- */}
                {timeSlots.length > 0 ? (
                  timeSlots.map((slot) => (<option key={slot} value={slot}>{slot}</option>))
                ) : (
                  <option disabled>No time slots available</option>
                )}
              </select>
            </div>
            <input className="w-full border p-2 rounded" placeholder="Your Name" value={userName} onChange={(e) => setUserName(e.target.value)} />
            <input className="w-full border p-2 rounded" placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            
            <button
              className="w-full bg-blue-900 text-white font-bold py-3 rounded-lg disabled:bg-slate-400 hover:bg-blue-800 transition-colors"
              onClick={handleBook}
              disabled={loading}
            >
              {loading ? "Booking..." : "Confirm Booking"}
            </button>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}