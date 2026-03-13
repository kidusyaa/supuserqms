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
import { CalendarIcon, Clock, User, Phone, FileText, CreditCard, Building, Wallet } from "lucide-react"

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

  // Helper to get appropriate icon for bank type
  const getBankIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'telebirr':
      case 'm-pesa':
        return <Wallet className="h-4 w-4" />;
      case 'cbe':
      case 'bank':
        return <Building className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Confirm Your Appointment</DialogTitle>
          <DialogDescription>
            Please review your details and complete the booking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Service & Provider Summary Card */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-200">
            <div className="flex items-start gap-4">
              <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0 border border-slate-200">
                <Image
                  src={service.photo || "/placeholder.svg?height=64&width=64"}
                  alt={service.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base truncate">{service.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{company.name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {service.estimated_wait_time_mins} min
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {selectedProvider.name}
                  </span>
                </div>
              </div>
              {service.price && (
                <div className="text-right">
                  <span className="text-lg font-bold">
                    {service.price} ETB
                  </span>
                </div>
              )}
            </div>

            {selectedSlot && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{format(selectedSlot.start, 'EEEE, MMM d')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{format(selectedSlot.start, 'h:mm a')} - {format(selectedSlot.end, 'h:mm a')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Prepayment Notice (if required) */}
          {requiresPayment && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <CreditCard className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Prepayment Required</p>
                  <p className="text-sm text-amber-700">
                    This service requires a prepayment of <strong>{service.prepayment_amount} {service.currency || "ETB"}</strong>.
                  </p>
                </div>
              </div>

              {/* Bank Accounts Display */}
              {company.bank_accounts && Array.isArray(company.bank_accounts) && company.bank_accounts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-amber-800 uppercase tracking-wider">Bank Details</p>
                  <div className="grid gap-2">
                    {company.bank_accounts
                      .filter(account => account.is_active !== false)
                      .map((account, index) => (
                        <div key={account.id || index} className="bg-white rounded border border-amber-200 p-2 text-xs">
                          <div className="flex items-center gap-2 font-medium">
                            {getBankIcon(account.account_type)}
                            <span>{account.account_type || "Bank Account"}</span>
                          </div>
                          <div className="mt-1 text-muted-foreground">
                            <div><span className="font-medium">Name:</span> {account.account_user_name}</div>
                            <div><span className="font-medium">Number:</span> {account.account_number}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Payment Proof Input */}
              <div className="space-y-1">
                <Label htmlFor="paymentProof" className="text-xs font-medium text-amber-800">
                  Transaction Link / Reference <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="paymentProof"
                  value={paymentProof}
                  onChange={(e) => setPaymentProof(e.target.value)}
                  placeholder="Paste your transaction link or reference number"
                  className="bg-white border-amber-300 focus-visible:ring-amber-500"
                  required={requiresPayment}
                />
                <p className="text-xs text-amber-600">
                  After payment, provide the link or reference for verification.
                </p>
              </div>
            </div>
          )}

          {/* User Details Form */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Your Information</h4>

            <div className="space-y-2">
              <Label htmlFor="userName" className="flex items-center gap-1">
                <User className="h-4 w-4" /> Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1">
                <Phone className="h-4 w-4" /> Phone Number <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-[110px]">
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

            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-1">
                <FileText className="h-4 w-4" /> Notes (Optional)
              </Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests?"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleBookingConfirm} 
            disabled={isLoading || !selectedSlot || !isValidName || !isValidLocal || !isValidPaymentProof}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span> Booking...
              </>
            ) : (
              "Confirm Booking"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}