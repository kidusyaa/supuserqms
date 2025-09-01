"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
// --- THE FIX: Import the new Supabase function ---
import { createQueueEntry, CreateQueuePayload } from "@/lib/supabase-utils"; 
import { Service, Provider, Company } from "@/type";
// UI Imports (shadcn/ui example)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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

// --- CHANGE #2: Update the props interface ---
interface JoinQueueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
  company: Company; 
  selectedProvider: Provider;
}

// Country codes data
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

export function JoinQueueDialog({ open, onOpenChange, service, company, selectedProvider }: JoinQueueDialogProps) {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+251"); // Default to Ethiopia
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number>(0);
  const [smsStatus, setSmsStatus] = useState<string>("");

  const handleJoinQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !phoneNumber) {
        setError("Please fill in your name and phone number.");
        return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      // --- THE FIX: Create a clean, simple payload object ---
      const fullPhoneNumber = countryCode + phoneNumber;
      const queueData: CreateQueuePayload = {
        user_name: userName,
        phone_number: fullPhoneNumber,
        service_id: service.id,
        provider_id: selectedProvider.id,
        queue_type: "walk-in",
      };

      // Call the API function. It handles all the complex logic now.
      const newQueueEntry = await createQueueEntry(queueData);
      setQueuePosition(newQueueEntry.position);
      setSmsStatus("SMS notification sent successfully! 📱");
      setJoinSuccess(true);

      setTimeout(() => {
        router.push("/services"); // Or a success/dashboard page
      }, 3000);

    } catch (err: any) {
      // Display a more helpful error if possible
      setError(err.message || "Failed to join. Please try again.");
      console.error(err); // Log the full error for debugging
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setUserName("");
      setPhoneNumber("");
      setCountryCode("+251");
      setError("");
      setJoinSuccess(false);
      setQueuePosition(0);
      setSmsStatus("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {joinSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-green-600">
                Success! 🎉
              </DialogTitle>
              <DialogDescription>
                <div className="space-y-2">
                  <p>You're in the queue for <strong>{service.name}</strong> at <strong>{company.name}</strong>.</p>
                  <p className="text-lg font-semibold text-blue-600">Your position: #{queuePosition}</p>
                  {smsStatus && (
                    <p className="text-sm text-green-600">{smsStatus}</p>
                  )}
                  <p className="text-sm text-gray-600">We'll notify you via SMS when it's your turn!</p>
                </div>
              </DialogDescription>
            </DialogHeader>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Join Queue for {service.name}</DialogTitle>
              <DialogDescription>
                You are joining the queue with **{selectedProvider.name}**.
                Enter your details below to confirm.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleJoinQueue}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Your Name"
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    Phone
                  </Label>
                  <div className="col-span-3 flex gap-2">
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
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="912345678"
                      className="flex-1"
                      required
                    />
                  </div>
                </div>
              </div>
              {error && (
                <p className="text-center text-sm text-red-500">{error}</p>
              )}
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Joining..." : "Confirm & Join Queue"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
