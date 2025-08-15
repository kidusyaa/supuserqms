"use client";

import { useState, useEffect, useMemo } from "react"; // <-- Import useMemo
import { useRouter } from "next/navigation";
import { joinQueue } from "@/lib/firebase-utils";
import { Dialog, DialogContent,DialogHeader, DialogTitle, DialogDescription /* ... other dialog imports */ } from "@/components/ui/dialog";
import { Icon } from "@iconify/react";
import { generateTimeSlots } from "@/lib/time-utils"; // <-- Import our new utility
import { Service, Company, Provider } from "@/type"; // <-- Import types

// --- Updated props interface ---
interface BookServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
  company: Company;
  selectedProvider: Provider;
}

export default function BookServiceDialog({
  open,
  onOpenChange,
  service,
  company,
  selectedProvider,
}: BookServiceDialogProps) {
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
    // useMemo prevents recalculating on every render
    return generateTimeSlots(company.workingHours, service.estimatedWaitTime);
  }, [company.workingHours, service.estimatedWaitTime]);

  const handleBook = async () => {
    if (!userName || !phoneNumber || !date || !time) {
        setError("Please fill out all fields.");
        return;
    }
    setLoading(true);
    setError("");
    try {
      const queueData = {
        serviceId: service.id,
        providerId: selectedProvider.id,
        userName,
        phoneNumber,
        queueType: "booking",
        userUid: "guest",
        notes: `Booking for ${date} at ${time}`,
      };
      await joinQueue(company.id, service.id, queueData); // Use company.id
      setSuccess(true);
      setTimeout(() => {
        router.push("/");
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