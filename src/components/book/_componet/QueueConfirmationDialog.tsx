"use client";

import { useRouter } from "next/navigation";
import { format, addMinutes } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import type { Company, Service, Provider, QueueItem } from "@/type";

// Extend QueueItem again to ensure estimatedServiceStartTime is available
interface ConfirmedQueueItem extends QueueItem {
    estimatedServiceStartTime?: Date | null;
}

interface QueueConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queueEntry: ConfirmedQueueItem; // Use the augmented type
  service: Service; // Pass these for robust display
  company: Company;
  selectedProvider: Provider;
}

export function QueueConfirmationDialog({
  open,
  onOpenChange,
  queueEntry,
  service,
  company,
  selectedProvider,
}: QueueConfirmationDialogProps) {
  const router = useRouter();

  // Use the estimatedServiceStartTime passed from the parent
  const estimatedStartTime = queueEntry.estimatedServiceStartTime;
  const arriveByTime = estimatedStartTime ? addMinutes(estimatedStartTime, -30) : null;

  const handleClose = () => {
    onOpenChange(false);
    //Optionally, navigate to home or a user's queue status page
    router.push('/');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold text-blue-600">
            <span className="mr-2">🚶‍♂️</span>Queue Joined!
          </DialogTitle>
          <DialogDescription className="text-md mt-1">
            You've been added to the queue for {service.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-sm">
          <div className="flex items-center space-x-4 border-b pb-3">
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

          <div className="space-y-2">
            <p><strong>Provider:</strong> {selectedProvider.name}</p>
            
            <p><strong>Your Current Position:</strong> {queueEntry.position}</p>
            <p><strong>Service Duration:</strong> {service.estimated_wait_time_mins} minutes</p>
          </div>

          {estimatedStartTime ? (
            <div className="bg-orange-50 border-l-4 border-tertiary p-3 rounded-md">
              <p className="text-base font-semibold text-tertiary ">
                Estimated Start: {format(estimatedStartTime, 'EEEE, MMM do, h:mm a')}
              </p>
              {arriveByTime && (
                <p className="text-primary mt-1">
                  Please arrive by <span className="font-bold">{format(arriveByTime, 'h:mm a')}</span> to ensure you don't miss your turn.
                </p>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-md text-yellow-800">
                <p className="font-semibold">Estimated Start Time is currently unavailable.</p>
                <p className="mt-1">We will notify you when your turn is near. Please keep an eye on your status.</p>
            </div>
          )}

          <div className="space-y-2 mt-2">
            <p><strong>Joined By:</strong> {queueEntry.user_name}</p>
            {queueEntry.phone_number && (
              <p><strong>Phone:</strong> {queueEntry.phone_number}</p>
            )}
            {queueEntry.notes && (
              <p><strong>Notes:</strong> <span className="italic">{queueEntry.notes}</span></p>
            )}
          </div>

        </div>
        <DialogFooter className="mt-4">
          <Button onClick={handleClose}>
            OK
          </Button>
          {/* You could add a button to go to a live queue status page here */}
          {/* <Button variant="outline" onClick={() => { handleClose(); router.push('/my-queue-status'); }}>
            View Live Status
          </Button> */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}