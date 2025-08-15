"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { joinQueue } from "@/lib/firebase-utils";

// --- CHANGE #1: Import the Company type ---
import { Service, Provider, Company, CreateQueueItem } from "@/type";

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

// --- CHANGE #2: Update the props interface ---
interface JoinQueueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
  company: Company; // Changed from companyId: string
  selectedProvider: Provider;
}

export function JoinQueueDialog({
  open,
  onOpenChange,
  service,
  company,
  selectedProvider,
}: JoinQueueDialogProps) {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState(false);

  const handleJoinQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const userUid = "some-user-uid"; // TODO: Replace with real auth logic

      const queueData: CreateQueueItem = {
        userName,
        phoneNumber,
        userUid,
        serviceId: service.id,
        providerId: selectedProvider.id,
        queueType: "walk-in",
      };

      // --- CHANGE #3: Use company.id from the object ---
      await joinQueue(company.id, service.id, queueData);
      setJoinSuccess(true);

      setTimeout(() => {
        router.push("/"); // Redirect to the user dashboard
      }, 2000);
    } catch (err) {
      setError("Failed to join. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setUserName("");
      setPhoneNumber("");
      setError("");
      setJoinSuccess(false);
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
                Success!
              </DialogTitle>
              <DialogDescription>
                You're in the queue for **{service.name}**. We'll notify you
                shortly.
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
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+251"
                    className="col-span-3"
                    required
                  />
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
