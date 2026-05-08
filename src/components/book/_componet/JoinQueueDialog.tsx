"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
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
import Image from "next/image";
import { toast } from "sonner";

import { getAuthUserOrNull, getMyProfileOrNull, isProfileComplete, joinQueue, CreateQueuePayload } from "@/lib/supabase-utils"; // Make sure this is the *updated* joinQueue
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
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setNotes('');
    }
  }, [open]);

  useEffect(() => {
    const ensureAuthedAndProfiled = async () => {
      if (!open) return;

      const user = await getAuthUserOrNull();
      if (!user) {
        onOpenChange(false);
        router.push(`/auth?next=${encodeURIComponent(pathname || "/")}`);
        return;
      }

      const profile = await getMyProfileOrNull();
      if (!profile || !isProfileComplete(profile)) {
        onOpenChange(false);
        router.push(`/profile?next=${encodeURIComponent(pathname || "/")}`);
        return;
      }
    };

    ensureAuthedAndProfiled();
  }, [open, pathname, router, onOpenChange]);

  const handleJoinQueue = async () => {
    setIsLoading(true);
    try {
      // --- Use the new CreateQueuePayload type ---
      const queueEntryPayload: CreateQueuePayload = { // <--- Explicitly type with CreateQueuePayload
          service_id: service.id,
          provider_id: selectedProvider.isAny ? null : selectedProvider.id,
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
      if (error?.code === "AUTH_REQUIRED") {
        onOpenChange(false);
        router.push(`/auth?next=${encodeURIComponent(pathname || "/")}`);
        return;
      }
      if (error?.code === "PROFILE_INCOMPLETE") {
        onOpenChange(false);
        router.push(`/profile?next=${encodeURIComponent(pathname || "/")}`);
        return;
      }
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
          <Button onClick={handleJoinQueue} disabled={isLoading}>
            {isLoading ? "Joining..." : "Join Queue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}