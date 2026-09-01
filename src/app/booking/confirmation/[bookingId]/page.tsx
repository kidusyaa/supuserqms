"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBookingDetails } from "@/lib/supabase-utils";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Icon } from "@iconify/react";
import PaymentVerificationModal from "@/components/book/_componet/PaymentVerificationModal";
import type { Booking } from "@/type";

export default function BookingConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const bookingId = params.bookingId as string;

  const fetchBooking = async () => {
    if (!bookingId) return;
    try {
      const data = await getBookingDetails(bookingId);
      if (!data) {
        throw new Error("Booking not found.");
      }
      setBooking(data);
    } catch (err: any) {
      console.error("Failed to fetch booking:", err);
      setError(err.message || "Could not load booking details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!bookingId) {
      setError("Booking ID is missing.");
      setLoading(false);
      return;
    }
    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-4 text-lg">Loading booking details...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center">
        <div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-muted-foreground mb-4">{error || "Could not find your booking."}</p>
          <Button onClick={() => router.push("/")}>Go to Home</Button>
        </div>
      </div>
    );
  }

  const startDate = parseISO(booking.start_time);
  const endDate = parseISO(booking.end_time);
  const companyId = booking.company_id;
  const isApproved = booking.payment_status === "approved" || booking.status === "confirmed";
  const isRejected = booking.payment_status === "rejected";
  const isPendingPayment = booking.payment_status === "pending";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-2 flex items-center justify-center text-2xl shadow-xs">
              {isApproved && (
                <div className="w-full h-full rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <Icon icon="solar:check-circle-bold" className="w-8 h-8" />
                </div>
              )}
              {isRejected && (
                <div className="w-full h-full rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                  <Icon icon="solar:danger-triangle-bold" className="w-8 h-8" />
                </div>
              )}
              {isPendingPayment && (
                <div className="w-full h-full rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <Icon icon="solar:clock-circle-bold" className="w-8 h-8" />
                </div>
              )}
            </div>

            <CardTitle className="text-2xl font-bold font-serif">
              {isApproved && "Booking Confirmed!"}
              {isRejected && "Payment Proof Rejected"}
              {isPendingPayment && "Deposit Verification Pending"}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              {isApproved && "Your appointment has been successfully scheduled."}
              {isRejected && "The business was unable to approve your receipt. Please re-upload your proof."}
              {isPendingPayment && "Your booking is reserved pending deposit verification."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            {/* Re-upload Callout for Rejected/Pending */}
            {(isRejected || isPendingPayment) && (
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-amber-900 dark:text-amber-200">
                  <p className="font-bold">
                    {isRejected ? "Action Required: Re-upload Proof" : "Deposit Verification Needed"}
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                    {isRejected
                      ? "Submit a clear transaction screenshot to confirm your slot."
                      : "Upload your transfer screenshot so the business can confirm."}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setPaymentModalOpen(true)}
                  className="bg-[#0f2937] hover:bg-black text-white rounded-full text-xs font-bold shrink-0 cursor-pointer shadow-xs"
                >
                  <Icon icon="solar:restart-bold" className="w-3.5 h-3.5 mr-1 text-amber-400" />
                  <span>{isRejected ? "Re-upload Receipt" : "Upload Receipt"}</span>
                </Button>
              </div>
            )}

            <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Image
                src={booking.service?.photo || "/placeholder.svg?height=80&width=80"}
                alt={booking.service?.name || "Service"}
                width={70}
                height={70}
                className="rounded-xl object-cover bg-white"
              />
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {booking.service?.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{booking.company?.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-muted-foreground text-[11px]">Appointment ID</p>
                <p className="font-mono font-semibold">{booking.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-[11px]">Payment Status</p>
                <p className="font-semibold capitalize text-amber-600 dark:text-amber-400">
                  {booking.payment_status || "not_required"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-[11px]">Date</p>
                <p className="font-semibold">{format(startDate, "PPPP")}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-[11px]">Time</p>
                <p className="font-semibold">
                  {format(startDate, "p")} - {format(endDate, "p")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-[11px]">Provider</p>
                <p className="font-semibold">{booking.provider?.name || "Assigned Specialist"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-[11px]">Duration</p>
                <p className="font-semibold">{booking.service?.estimated_wait_time_mins || 30} minutes</p>
              </div>
              <div>
                <p className="text-muted-foreground text-[11px]">Booked By</p>
                <p className="font-semibold">{booking.user_name}</p>
              </div>
              {booking.phone_number && (
                <div>
                  <p className="text-muted-foreground text-[11px]">Phone Number</p>
                  <p className="font-semibold">{booking.phone_number}</p>
                </div>
              )}
            </div>

            {booking.notes && (
              <div className="text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <p className="text-muted-foreground text-[11px]">Notes</p>
                <p className="font-medium italic text-slate-700 dark:text-slate-300 mt-0.5">
                  {booking.notes}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              {companyId ? (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/company/${companyId}`)}
                  className="w-full sm:w-auto rounded-full text-xs"
                >
                  Back to {booking.company?.name || "Company"}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="w-full sm:w-auto rounded-full text-xs"
                >
                  Back to Home
                </Button>
              )}
              <Button
                onClick={() => router.push("/profile")}
                className="w-full sm:w-auto rounded-full text-xs font-bold bg-[#0f2937] hover:bg-black text-white cursor-pointer"
              >
                <Icon icon="solar:user-circle-bold" className="w-4 h-4 text-amber-400 mr-1.5" />
                <span>Go to My Bookings</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Re-upload Modal */}
      {booking.service && booking.company && (
        <PaymentVerificationModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          booking={booking}
          service={booking.service}
          company={booking.company}
          selectedProvider={
            booking.provider || {
              id: booking.provider_id || "provider",
              name: "Assigned Specialist",
              specialization: null,
              is_active: true,
              created_at: new Date().toISOString(),
              company_id: booking.company_id,
            }
          }
          onSuccess={() => {
            fetchBooking();
          }}
        />
      )}
    </div>
  );
}