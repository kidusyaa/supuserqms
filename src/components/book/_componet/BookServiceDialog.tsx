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
import { Calendar, Clock, User, Wallet, AlertCircle, Building2, Copy, Check } from "lucide-react"

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
  
  // Track which account index was copied to show the checkmark
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const isValidName = userName.trim().length > 0;
  const isValidLocal = phoneLocal.trim().length >= 7;
  const requiresPayment = service.requires_prepayment && service.prepayment_amount;
  const isValidPaymentProof = !requiresPayment || paymentProof.trim().length > 0;

  // Updated Copy function to show inline feedback
  const handleCopyAccount = async (accountNumber: string, index: number) => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopiedIndex(index); // Set the active copied item
      toast.success("Account number copied!");
      
      // Revert the icon back after 2 seconds
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    } catch (err) {
      toast.error("Failed to copy account number.");
    }
  };

  const handleBookingConfirm = async () => {
    setIsLoading(true);
    try {
      if (!isValidName) return toast.error("Please provide your name.");
      if (!isValidLocal) return toast.error("Please enter a valid phone number.");
      if (requiresPayment && !paymentProof.trim()) return toast.error("Please provide payment proof.");
      if (!selectedSlot) return toast.error("No time slot selected.");

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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>Confirm Appointment</DialogTitle>
          <DialogDescription>
            Review your details and complete your booking.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          
          {/* Service & Company Summary */}
          <div className="flex items-center space-x-4 bg-muted/30 p-3 rounded-xl border">
            <Image
              src={service.photo || "/placeholder.svg?height=60&width=60"}
              alt={service.name}
              width={60}
              height={60}
              className="rounded-lg object-cover bg-white"
            />
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold truncate">{service.name}</p>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Building2 className="w-3.5 h-3.5 mr-1" />
                <span className="truncate">{company.name}</span>
              </div>
            </div>
          </div>

          {/* Appointment Details Grid */}
          {selectedSlot ? (
            <div className="grid grid-cols-2 gap-4 text-sm bg-muted/10 p-4 rounded-xl border">
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="w-4 h-4"/> Date</span>
                <p className="font-medium">{format(selectedSlot.start, 'MMM d, yyyy')}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="w-4 h-4"/> Time</span>
                <p className="font-medium">{format(selectedSlot.start, 'h:mm a')} - {format(selectedSlot.end, 'h:mm a')}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1.5"><User className="w-4 h-4"/> Provider</span>
                <p className="font-medium">{selectedProvider.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1.5"><Wallet className="w-4 h-4"/> Price</span>
                <p className="font-medium text-primary"> ETB {service.price}</p>
              </div>
            </div>
          ) : (
            <p className="text-red-500 text-sm p-3 bg-red-50 rounded-lg">No time slot selected.</p>
          )}

          {/* Prepayment Section */}
          {requiresPayment && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-800 font-medium">Prepayment Required</p>
                    <p className="text-sm text-amber-700 mt-1">Amount due now: <strong>ETB{service.prepayment_amount}</strong></p>
                  </div>
                </div>
                
                {company.bank_accounts && Array.isArray(company.bank_accounts) && company.bank_accounts.length > 0 ? (
                  <div className="bg-white/60 p-3 rounded-lg border border-amber-100 space-y-2 mt-2">
                    <p className="text-xs font-semibold text-amber-900 uppercase tracking-wider">Bank Accounts</p>
                    {company.bank_accounts.filter(account => account.is_active !== false).map((account, index) => (
                      <div key={account.id || index} className="text-sm flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-amber-100/50 last:border-0 pb-2 last:pb-0">
                        <span className="font-medium text-gray-700">{account.account_type}</span>
                        <div className="flex items-center gap-2 mt-1 sm:mt-0 relative">
                          <span className="text-gray-600 font-mono text-xs">{account.account_number}</span>
                          
                          {/* Updated Button to toggle between Copy and Check icon */}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-7 px-2 flex items-center gap-1.5 transition-colors ${
                              copiedIndex === index 
                                ? "text-green-600 bg-green-50 hover:bg-green-100" 
                                : "text-gray-400 hover:text-amber-700 hover:bg-amber-100/50"
                            }`}
                            onClick={() => handleCopyAccount(account.account_number, index)}
                          >
                            {copiedIndex === index ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-medium uppercase tracking-wider">Copied</span>
                              </>
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="paymentProof">Payment Proof (Transaction link/Ref) <span className="text-red-500">*</span></Label>
                <Input
                  id="paymentProof"
                  value={paymentProof}
                  onChange={(e) => setPaymentProof(e.target.value)}
                  placeholder="e.g. TXN-123456789"
                />
              </div>
            </div>
          )}

          {/* User Details Form */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="userName">Full Name <span className="text-red-500">*</span></Label>
              <Input
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phoneLocal">Phone Number <span className="text-red-500">*</span></Label>
              <div className="flex gap-2">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-[110px] shrink-0">
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
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Additional Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests?"
              />
            </div>
          </div>

        </div>

        {/* Fixed Footer */}
        <DialogFooter className="px-6 py-4 border-t shrink-0 bg-gray-50/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleBookingConfirm} disabled={isLoading || !selectedSlot || !isValidName || !isValidLocal || !isValidPaymentProof} className="w-full sm:w-auto mt-2 sm:mt-0">
            {isLoading ? "Confirming..." : "Confirm Booking"}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}