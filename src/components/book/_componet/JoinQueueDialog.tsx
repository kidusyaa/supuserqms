"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation" // Keep router for potential redirects, though not used in new flow
import { format, isToday, addMinutes } from "date-fns"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { toast } from "sonner"

import { joinQueue } from "@/lib/supabase-utils"
import type { Company, Service, Provider, QueueItem, QueueTypeStatus, QueueEntryStatus } from "@/type"

interface JoinQueueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
  company: Company;
  selectedProvider: Provider;
  currentQueueCount: number;
  estimatedQueueStartTime: Date | null;
  // NEW: Callback for successful queue join
  onQueueJoined: (queueEntry: QueueItem, estimatedStartTime: Date | null) => void;
}

export function JoinQueueDialog({
  open,
  onOpenChange,
  service,
  company,
  selectedProvider,
  currentQueueCount,
  estimatedQueueStartTime,
  onQueueJoined, // NEW
}: JoinQueueDialogProps) {
  const router = useRouter(); // router still useful if you want to allow a "Go to queue status page"
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setUserName('');
      setPhoneNumber('');
      setNotes('');
    }
  }, [open]);

  const handleJoinQueue = async () => {
    setIsLoading(true);
    try {
      if (!userName.trim()) {
        toast.error("Please provide your name to join the queue.");
        setIsLoading(false);
        return;
      }
      const queueEntryData: Omit<QueueItem, "id" | "joined_at" | "status" | "position"> & { status?: QueueEntryStatus; position?: number | null; user_id: string | null; } = {
            user_id: null,
            service_id: service.id,
            provider_id: selectedProvider.id,
            user_name: userName.trim(),
            phone_number: phoneNumber.trim() || null,
            notes: notes.trim() || null,
            position: currentQueueCount + 1, // This is an estimate, backend will assign actual position
            queue_type: 'walk-in' as QueueTypeStatus,
        };

      const createdQueueEntry = await joinQueue(queueEntryData);

      if (!createdQueueEntry || !createdQueueEntry.id) {
        throw new Error("Queue entry created but no ID returned.");
      }

      toast.success("You have successfully joined the queue!");
      onOpenChange(false); // Close this dialog

      // Call the callback to open the new confirmation dialog
      onQueueJoined(createdQueueEntry, estimatedQueueStartTime); // Pass the current estimate

    } catch (error) {
      console.error("Failed to join queue:", error);
      toast.error("Failed to join queue. Please try again.");
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
            <Label htmlFor="phoneNumber" className="text-right">Phone</Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="col-span-3"
              placeholder="Optional"
            />
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
          <Button onClick={handleJoinQueue} disabled={isLoading || !userName.trim()}>
            {isLoading ? "Joining..." : "Join Queue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}