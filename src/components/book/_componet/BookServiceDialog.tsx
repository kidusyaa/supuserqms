"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
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
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createBooking } from "@/lib/supabase-utils"
import type { Company, Service, Provider, AvailableSlot } from "@/type"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BookServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
  company: Company;
  selectedProvider: Provider;
  selectedSlot: AvailableSlot | null;
}

export default function BookServiceDialog({
  open,
  onOpenChange,
  service,
  company,
  selectedProvider,
  selectedSlot,
}: BookServiceDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [countryCode, setCountryCode] = useState("+251");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentProof, setPaymentProof] = useState("");
  const isValidName = userName.trim().length > 0;
  const isValidLocal = phoneLocal.trim().length >= 7;
  const requiresPayment = service.requires_prepayment && service.prepayment_amount;
  const isValidPaymentProof = !requiresPayment || paymentProof.trim().length > 0;

  const handleBookingConfirm = async () => {
    setIsLoading(true);
    try {
      if (!isValidName) {
        toast.error("Please provide your name to book this service.");
        setIsLoading(false);
        return;
      }
      if (!isValidLocal) {
        toast.error("Please enter a valid phone number.");
        setIsLoading(false);
        return;
      }

      if (requiresPayment && !paymentProof.trim()) {
        toast.error("Please provide payment proof for this service.");
        setIsLoading(false);
        return;
      }

      if (!selectedSlot) {
        toast.error("No time slot selected.");
        setIsLoading(false);
        return;
      }

      const sanitizedLocal = phoneLocal.replace(/[^\d]/g, '');
      const fullPhone = `${countryCode}${sanitizedLocal}`;

      const newBookingData = { 
        user_id: null,
        user_name: userName.trim(),
        phone_number: fullPhone,
        service_id: service.id,
        company_id: company.id,
        provider_id: selectedProvider.id,
        start_time: selectedSlot.start.toISOString(),
        end_time: selectedSlot.end.toISOString(),
        status: 'confirmed' as const,
        notes: notes.trim() || null,
        payment_proof: requiresPayment ? paymentProof.trim() || null : null,
      };

      const createdBooking = await createBooking(newBookingData);

      if (!createdBooking || !createdBooking.id) {
        throw new Error("Booking created but no ID returned.");
      }

      toast.success("Service booked successfully!");
      onOpenChange(false); 
      
      router.push(`/booking/confirmation/${createdBooking.id}`); 
      
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Failed to book service. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Appointment</DialogTitle>
          <DialogDescription>
            Review your appointment details and confirm.
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
          {selectedSlot ? (
            <div className="space-y-2">
              <p><strong>Date:</strong> {format(selectedSlot.start, 'PPP')}</p>
              <p><strong>Time:</strong> {format(selectedSlot.start, 'p')} - {format(selectedSlot.end, 'p')}</p>
              <p><strong>Provider:</strong> {selectedProvider.name}</p>
              <p><strong>Duration:</strong> {service.estimated_wait_time_mins} minutes</p>
              <p><strong>Price:</strong> {service.price}</p>
              {requiresPayment && (
                <div className="space-y-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-amber-800 font-medium">
                    ⚠️ Prepayment Required
                  </p>
                  <p className="text-sm text-amber-700">
                    <strong>Amount:</strong> ${service.prepayment_amount}
                  </p>
                  <p className="text-xs text-amber-600">
                    Please complete the payment and provide the transaction link below.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-red-500">No time slot selected.</p>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="userName" className="text-right">Your Name</Label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="col-span-3"
              required
            />
          </div>

          {requiresPayment && (
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">Bank Details:</p>
                {company.bank_accounts && Array.isArray(company.bank_accounts) && company.bank_accounts.length > 0 ? (
                  <div className="space-y-1">
                    {company.bank_accounts.filter(account => account.is_active !== false).map((account, index) => (
                      <div key={account.id || index} className="text-xs text-blue-700">
                        <p><strong>Bank:</strong> {account.account_type}</p>
                        <p><strong>Account Name:</strong> {account.account_user_name}</p>
                        <p><strong>Account Number:</strong> {account.account_number}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-blue-600">Bank details will be provided after booking confirmation.</p>
                )}
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paymentProof" className="text-right">Payment Proof *</Label>
                <Input
                  id="paymentProof"
                  value={paymentProof}
                  onChange={(e) => setPaymentProof(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter transaction link or reference"
                  required={requiresPayment ? true : undefined}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phoneLocal" className="text-right">Your Phone</Label>
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
              placeholder="Any special requests?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleBookingConfirm} disabled={isLoading || !selectedSlot || !isValidName || !isValidLocal || !isValidPaymentProof}>
            {isLoading ? "Booking..." : "Confirm Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}