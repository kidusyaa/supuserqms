"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBookingDetails, getBookingGroupDetails } from "@/lib/supabase-utils";
import { format, parseISO } from "date-fns";
import { formatEthiopian } from "@/lib/ethiopian-calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Icon } from "@iconify/react";
import PaymentVerificationModal from "@/components/book/_componet/PaymentVerificationModal";
import { LogoLoader } from "@/components/ui/LogoLoader";
import type { Booking } from "@/type";

export default function BookingConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [groupBookings, setGroupBookings] = useState<Booking[]>([]);
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
      if (data.booking_group_id) {
        try {
          const group = await getBookingGroupDetails(data.booking_group_id);
          if (group && group.length > 0) {
            setGroupBookings(group);
          }
        } catch (gErr) {
          console.debug("Could not fetch group bookings:", gErr);
        }
      }
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
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <LogoLoader
          variant="flip"
          size="lg"
          text="Loading booking details"
          subtext="Retrieving your reservation confirmation"
        />
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
                <p className="font-semibold text-slate-900 dark:text-white">
                  {formatEthiopian(startDate, { locale: "am", includeWeekday: true })}
                </p>
                <p className="text-[11px] text-slate-400">
                  {format(startDate, "PPPP")}
                </p>
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

            {/* Component Snapshot Breakdown */}
            {booking.booking_components && booking.booking_components.length > 0 && (
              <div className="bg-slate-50/70 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Icon icon="solar:layers-minimalistic-bold" className="w-4 h-4 text-amber-600" />
                    <span>Included Steps &amp; Add-ons ({booking.booking_components.length})</span>
                  </div>
                  {booking.booking_group_id && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                      Multi-Service Group
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 pt-1">
                  {booking.booking_components.map((bc) => {
                    const comp = bc.component;
                    const isPhase = comp?.component_type === "phase";

                    return (
                      <div
                        key={bc.id}
                        className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isPhase ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          <span className="font-semibold text-slate-900 dark:text-white truncate">
                            {comp?.name || "Service Item"}
                          </span>
                          {comp?.is_overlappable && (
                            <span className="text-[9px] text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-1 rounded font-medium">
                              Concurrent
                            </span>
                          )}
                          {bc.provider && (
                            <span className="text-[10px] text-slate-400">
                              by {bc.provider.name}
                            </span>
                          )}
                        </div>

                        <div className="text-right shrink-0 font-medium text-slate-700 dark:text-slate-300">
                          {bc.price_at_booking === 0
                            ? "Included"
                            : `+${bc.price_at_booking} ETB`}
                          {bc.duration_mins > 0 && (
                            <span className="text-[10px] text-slate-400 ml-1.5">
                              ({bc.duration_mins}m)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price Snapshot Summary */}
            <div className="bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Original Price</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {booking.original_price != null ? `${booking.original_price} ETB` : "N/A"}
                </span>
              </div>
              {Boolean(booking.discount_amount && booking.discount_amount > 0) && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount Applied</span>
                  <span>-{booking.discount_amount} ETB</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-900 dark:text-white">Final Total</span>
                <span className="text-base font-black text-amber-600">
                  {booking.final_price != null ? `${booking.final_price} ETB` : "N/A"}
                </span>
              </div>
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
          bookingGroupId={booking.booking_group_id}
          totalPrepaymentAmount={
            groupBookings.length > 0
              ? groupBookings.reduce((sum, b) => sum + (Number(b.prepayment_amount) || 0), 0) || (booking.service ? Number(booking.service.prepayment_amount) || 0 : 0)
              : (booking.service ? Number(booking.service.prepayment_amount) || 0 : 0)
          }
          serviceNames={
            groupBookings.length > 0
              ? (groupBookings.map((b) => b.service?.name).filter(Boolean) as string[])
              : (booking.service?.name ? [booking.service.name] : [])
          }
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