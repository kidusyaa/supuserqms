import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // <-- Import useRouter
import { joinQueue } from "@/lib/firebase-utils";
// Assuming you have a Dialog component structure like Shadcn/UI.
// If not, you can adapt this to your modal library.
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"; // Adjust this import to your component library
import { Icon } from "@iconify/react";


interface BookServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  serviceId: string;
  providerId: string;
}

export default function BookServiceDialog({
  open,
  onOpenChange,
  companyId,
  serviceId,
  providerId,
}: BookServiceDialogProps) {
  const router = useRouter(); // <-- Initialize router
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [userName, setUserName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

  const handleBook = async () => {
    if (!userName || !phoneNumber || !date || !time) {
        setError("Please fill out all fields.");
        return;
    }
    setLoading(true);
    setError("");
    try {
      const queueData = {
        serviceId,
        providerId,
        userName,
        phoneNumber,
        queueType: "booking",
        userUid: "guest", // Replace with actual user later
        notes: `Booking for ${date} at ${time}`,
      };
      await joinQueue(companyId, serviceId, queueData);
      setSuccess(true);

      // *** REDIRECTION LOGIC ***
      // Show success message for 2 seconds, then redirect.
      setTimeout(() => {
        router.push("/users"); // Redirect to the user dashboard
      }, 2000);

    } catch (e) {
      console.error("Booking failed:", e);
      setError("Failed to book the appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reset form when dialog is closed
  useEffect(() => {
    if (!open) {
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
                <option value="">Select a time</option>
                {timeSlots.map((slot) => (<option key={slot} value={slot}>{slot}</option>))}
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