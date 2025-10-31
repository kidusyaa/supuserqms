"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, isToday } from "date-fns"; // Make sure 'isToday' is imported

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
import { toast } from "sonner";

import { joinQueue, CreateQueuePayload } from "@/lib/supabase-utils"; // Make sure this is the *updated* joinQueue
import type { Company, Service, Provider, QueueItem, QueueTypeStatus, AugmentedQueueItem } from "@/type"; // Ensure QueueItem has projected_start/end_time

// --- UPDATED INTERFACE ---
// The callback now expects the backend-calculated estimated start AND end times.
interface JoinQueueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
  company: Company;
  selectedProvider: Provider;
  currentQueueCount: number;
  estimatedQueueStartTime: Date | null; // This is the PRE-JOIN client-side estimate
  // Callback now includes estimatedEndTime from the backend
  onQueueJoined: (queueEntry: QueueItem, estimatedStartTime: Date | null, estimatedEndTime: Date | null) => void;
}

export function JoinQueueDialog({
  open,
  onOpenChange,
  service,
  company,
  selectedProvider,
  currentQueueCount,
  estimatedQueueStartTime,
  onQueueJoined,
}: JoinQueueDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [countryCode, setCountryCode] = useState("+251");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [notes, setNotes] = useState("");
  const isValidName = userName.trim().length > 0;
  const isValidLocal = phoneLocal.trim().length >= 7;

  useEffect(() => {
    if (open) {
      setUserName('');
      setCountryCode('+251');
      setPhoneLocal('');
      setNotes('');
    }
  }, [open]);

  const handleJoinQueue = async () => {
    setIsLoading(true);
    try {
      if (!isValidName) {
        toast.error("Please provide your name to join the queue.");
        setIsLoading(false);
        return;
      }
      if (!isValidLocal) {
        toast.error("Please enter a valid phone number.");
        setIsLoading(false);
        return;
      }

      const sanitizedLocal = phoneLocal.replace(/[^\d]/g, '');
      const fullPhone = `${countryCode}${sanitizedLocal}`;

      // --- Use the new CreateQueuePayload type ---
      const queueEntryPayload: CreateQueuePayload = { // <--- Explicitly type with CreateQueuePayload
          service_id: service.id,
          provider_id: selectedProvider.id,
          user_name: userName.trim(),
          phone_number: fullPhone ,
          notes: notes.trim() || null,
          queue_type: 'walk-in',
      };

      const createdQueueEntry: AugmentedQueueItem = await joinQueue(queueEntryPayload);

      if (!createdQueueEntry || !createdQueueEntry.id) {
        throw new Error("Queue entry created but no ID returned from the server.");
      }

      toast.success("You have successfully joined the queue!");
      onOpenChange(false);

      onQueueJoined(
          createdQueueEntry,
          createdQueueEntry.estimatedServiceStartTime || null,
          createdQueueEntry.estimatedServiceEndTime || null
      );

    } catch (error: any) {
      console.error("Failed to join queue:", error);
      toast.error(error.message || "Failed to join queue. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join Queue for {service.name}</DialogTitle>
          <DialogDescription>
            You will be added to the walk-in queue for {selectedProvider.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-4">
            <Image
              src={service.photo || "/placeholder.svg?height=60&width=60"}
              alt={service.name}
              width={60}
              height={60}
              className="rounded-md object-cover"
            />
            <div>
              <p className="text-lg font-semibold">{service.name}</p>
              <p className="text-sm text-muted-foreground">{company.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="userName" className="text-right">Name</Label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phoneLocal" className="text-right">Phone</Label>
            <div className="col-span-3 flex gap-2">
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+251">🇪🇹 +251</SelectItem>
                  <SelectItem value="+1">🇺🇸 +1</SelectItem>
                  <SelectItem value="+44">🇬🇧 +44</SelectItem>
                  <SelectItem value="+91">🇮🇳 +91</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="phoneLocal"
                value={phoneLocal}
                onChange={(e) => setPhoneLocal(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="912345678"
                type="tel"
                inputMode="tel"
                required
                className="flex-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">Notes</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3"
              placeholder="Any specific requests?"
            />
          </div>

          <div className="space-y-2 text-sm mt-4">
            <p><strong>Provider:</strong> {selectedProvider.name}</p>
            <p><strong>Your estimated position:</strong> {currentQueueCount + 1} (Final position confirmed after joining)</p>

            {estimatedQueueStartTime ? (
              <p className="text-orange-600">
                <strong>Est. Start Time:</strong> {format(estimatedQueueStartTime, 'h:mm a')} {isToday(estimatedQueueStartTime) ? 'Today' : format(estimatedQueueStartTime, 'MMM do')}
              </p>
            ) : (
              <p className="text-red-500">
                <strong>Est. Start Time:</strong> Unavailable (Provider may be closed or fully booked.)
              </p>
            )}
            <p className="mt-2 text-primary font-semibold">
                Please arrive at least 30 minutes before your estimated start time.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleJoinQueue} disabled={isLoading || !isValidName || !isValidLocal}>
            {isLoading ? "Joining..." : "Join Queue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}