"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
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
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  createBooking,
  getAuthUserOrNull,
  getMyProfileOrNull,
  isProfileComplete,
} from "@/lib/supabase-utils";
import type {
  Company,
  Service,
  Provider,
  AvailableSlot,
  Booking,
  BookingStatus,
  PaymentStatus,
} from "@/type";
import { Calendar, Clock, User, Wallet, AlertCircle, Building2 } from "lucide-react";
import { Icon } from "@iconify/react";

interface BookServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
  company: Company;
  selectedProvider: Provider;
  selectedSlot: AvailableSlot | null;
  onPrepaymentRequired?: (booking: Booking) => void;
}

export default function BookServiceDialog({
  open,
  onOpenChange,
  service,
  company,
  selectedProvider,
  selectedSlot,
  onPrepaymentRequired,
}: BookServiceDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState("");

  const requiresPrepayment = Boolean(
    service.requires_prepayment && (service.prepayment_amount || 0) > 0
  );

  const handleBookingConfirm = async () => {
    setIsLoading(true);
    try {
      if (!selectedSlot) {
        toast.error("No time slot selected.");
        return;
      }

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

      // If prepayment is required: booking is created with pending status
      // If not: confirmed status
      const newBookingData = {
        user_id: user.id,
        user_name: profile.name || "",
        phone_number: profile.phone_number || "",
        service_id: service.id,
        company_id: company.id,
        provider_id: selectedProvider.id,
        start_time: selectedSlot.start.toISOString(),
        end_time: selectedSlot.end.toISOString(),
        status: (requiresPrepayment ? "pending" : "confirmed") as BookingStatus,
        payment_status: (requiresPrepayment ? "pending" : "not_required") as PaymentStatus,
        notes: notes.trim() || null,
      };

      const createdBooking = await createBooking(newBookingData);

      if (!createdBooking || !createdBooking.id) {
        throw new Error("Booking created but no ID returned.");
      }

      if (requiresPrepayment) {
        toast.info("Booking initialized. Please transfer deposit & upload proof.");
        onOpenChange(false);
        if (onPrepaymentRequired) {
          onPrepaymentRequired(createdBooking);
        }
      } else {
        toast.success("Service booked successfully!");
        onOpenChange(false);
        router.push(`/booking/confirmation/${createdBooking.id}`);
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      const anyErr = error as any;
      if (anyErr?.code === "AUTH_REQUIRED") {
        onOpenChange(false);
        router.push(`/auth?next=${encodeURIComponent(pathname || "/")}`);
        return;
      }
      if (anyErr?.code === "PROFILE_INCOMPLETE") {
        onOpenChange(false);
        router.push(`/profile?next=${encodeURIComponent(pathname || "/")}`);
        return;
      }
      toast.error(anyErr?.message || "Failed to book service. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-xl font-bold font-serif">Confirm Appointment</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Review your appointment details before confirming.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Service & Company Summary */}
          <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Image
              src={service.photo || "/placeholder.svg?height=60&width=60"}
              alt={service.name}
              width={60}
              height={60}
              className="rounded-xl object-cover bg-white shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                {service.name}
              </p>
              <div className="flex items-center text-xs text-slate-500 mt-1">
                <Building2 className="w-3.5 h-3.5 mr-1" />
                <span className="truncate">{company.name}</span>
              </div>
            </div>
          </div>

          {/* Appointment Details Grid */}
          {selectedSlot ? (
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/70 dark:bg-slate-900/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" /> Date
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {format(selectedSlot.start, "EEE, MMM d, yyyy")}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> Time
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {format(selectedSlot.start, "h:mm a")} - {format(selectedSlot.end, "h:mm a")}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-500" /> Provider
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedProvider.name}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-amber-500" /> Total Price
                </span>
                <p className="font-bold text-slate-900 dark:text-white">
                  ETB {service.price || "0"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-red-500 text-xs p-3 bg-red-50 rounded-xl">No time slot selected.</p>
          )}

          {/* Prepayment Notice */}
          {requiresPrepayment && (
            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-amber-900 dark:text-amber-200 font-bold text-xs">
                    Prepayment Deposit Required:{" "}
                    <span className="text-amber-600 dark:text-amber-400 font-black">
                      ETB {service.prepayment_amount}
                    </span>
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300/80 leading-relaxed">
                    This business requires a prepayment deposit. In the next step, you will view the
                    bank transfer accounts and upload your transaction receipt.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes Input */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold">
              Additional Notes / Requests (Optional)
            </Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or instructions?"
              className="text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Fixed Footer */}
        <DialogFooter className="px-6 py-4 border-t shrink-0 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto rounded-full text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleBookingConfirm}
            disabled={isLoading || !selectedSlot}
            className="w-full sm:w-auto mt-2 sm:mt-0 rounded-full text-xs font-bold bg-[#0f2937] hover:bg-black text-white cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Icon icon="solar:spinner-linear" className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </span>
            ) : requiresPrepayment ? (
              <span className="flex items-center gap-1.5">
                <span>Continue to Payment &amp; Proof</span>
                <Icon icon="solar:arrow-right-linear" className="w-4 h-4 text-amber-400" />
              </span>
            ) : (
              "Confirm Booking"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}