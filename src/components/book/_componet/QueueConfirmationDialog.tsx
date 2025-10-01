// components/book/_componet/QueueConfirmationDialog.tsx
"use client";

import React from 'react';
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
import { format, isToday } from "date-fns";
import type { Company, Service, Provider, QueueItem } from "@/type";
import { useRouter } from 'next/navigation';

interface ConfirmedQueueItem extends QueueItem {
    estimatedServiceStartTime?: Date | null;
    estimatedServiceEndTime?: Date | null;
}

interface QueueConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    queueEntry: ConfirmedQueueItem;
    service: Service;
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

    const handleViewQueueStatus = () => {
        onOpenChange(false);
        // Navigate to a dedicated queue status page if you have one
        // router.push(`/queue/status/${queueEntry.id}`);
        // For now, let's just go back to the service page or home
        router.push('/'); 
    };

    const startTime = queueEntry.estimatedServiceStartTime;
    const endTime = queueEntry.estimatedServiceEndTime;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Queue Joined Successfully!</DialogTitle>
                    <DialogDescription>
                        You have successfully joined the queue. Here are your details.
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
                    
                    <div className="space-y-2 text-sm mt-4">
                        <p><strong>Your Name:</strong> {queueEntry.user_name}</p>
                        {queueEntry.phone_number && <p><strong>Phone:</strong> {queueEntry.phone_number}</p>}
                        <p><strong>Provider:</strong> {selectedProvider.name}</p>
                        <p><strong>Your estimated position:</strong> {queueEntry.position}</p>
                        
                        {startTime && endTime ? (
                            <>
                                <p className="text-primary font-semibold">
                                    <strong>Est. Service Time:</strong> {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')} {isToday(startTime) ? 'Today' : format(startTime, 'MMM do')}
                                </p>
                                <p className="text-muted-foreground">
                                    Please arrive at least 30 minutes before your estimated start time.
                                </p>
                            </>
                        ) : (
                            <p className="text-red-500">
                                Estimated service time is currently unavailable.
                            </p>
                        )}
                        {queueEntry.notes && <p><strong>Notes:</strong> {queueEntry.notes}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                    <Button onClick={handleViewQueueStatus}>Go to Homepage</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}