"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useBookingCart } from "@/context/BookingCartContext";
import {
  createMultiServiceBookings,
  getAuthUserOrNull,
  getMyProfileOrNull,
} from "@/lib/supabase-utils";
import PaymentVerificationModal from "@/components/book/_componet/PaymentVerificationModal";
import DualCalendarPicker from "@/components/book/DualCalendarPicker";
import type { SelectedServiceItem, ServiceComponent, Booking, Company } from "@/type";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, parseISO, isPast, isSameDay, startOfDay } from "date-fns";
import { formatEthiopian } from "@/lib/ethiopian-calendar";

export default function MultiServiceCartModal() {
  const router = useRouter();
  const pathname = usePathname();
  const isBookingPage = pathname.startsWith("/booking/");
  const [inlineTarget, setInlineTarget] = useState<HTMLElement | null>(null);
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeItem,
    updateItemComponents,
    totalPrice,
    totalOriginalPrice,
    totalDiscountAmount,
    totalDurationMins,
    totalWorkloadMins,
    totalPrepaymentAmount,
    requiresPrepayment,
    clearCart,
    companyId,
    companyName,
  } = useBookingCart();

  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(
    format(startOfDay(new Date()), "yyyy-MM-dd")
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingBookingGroup, setPendingBookingGroup] = useState<{
    groupId: string;
    primaryBooking: Booking;
    totalPrepayment: number;
    company: Company;
    serviceNames: string[];
  } | null>(null);

  useEffect(() => {
    const target =
      isBookingPage && isCartOpen
        ? document.getElementById("booking-cart-review")
        : null;
    setInlineTarget(target);

    if (target) {
      window.requestAnimationFrame(() =>
        target.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    }
  }, [isBookingPage, isCartOpen, pathname]);

  // Prefill customer profile if available
  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const p = await getMyProfileOrNull();
        if (p) {
          if (p.name) setCustomerName(p.name);
          if (p.phone_number) setCustomerPhone(p.phone_number);
        }
      } catch {}
    };
    if (isCartOpen) {
      fetchProfile();
    }
  }, [isCartOpen]);

  if (items.length === 0 && isCartOpen) {
    setIsCartOpen(false);
    return null;
  }

  // Toggle optional add-on for a specific item
  const handleToggleAddon = (item: SelectedServiceItem, component: ServiceComponent) => {
    if (component.component_type !== "addon" || component.is_required) return;

    const isCurrentlySelected = item.selectedComponents.some((c) => c.id === component.id);
    let updated: ServiceComponent[];

    if (isCurrentlySelected) {
      updated = item.selectedComponents.filter((c) => c.id !== component.id);
    } else {
      updated = [...item.selectedComponents, component];
    }

    updateItemComponents(item.cartItemId, updated);
  };

  const handleAddMoreServices = () => {
    setIsCartOpen(false);
    const companySlug = items[0]?.service.company?.slug || companyId;
    if (companySlug) router.push(`/company/${companySlug}`);
  };

  // Submit all selected services
  const handleConfirmMultiBooking = async () => {
    if (!customerName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 9) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    if (!companyId) {
      toast.error("No valid business company identified for this booking.");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await getAuthUserOrNull();
      if (!user) {
        toast.info("Please sign in to confirm your multi-service booking.");
        router.push(`/auth?next=${encodeURIComponent(pathname || "/")}`);
        return;
      }

      // Compute sequential appointment slots for the day starting from 10:00 AM or scheduled time
      const baseDate = parseISO(selectedDate);
      let runningStart = new Date(baseDate);
      runningStart.setHours(10, 0, 0, 0);

      // Build payload for each service in the selection
      const bookingEntries = items.map((item) => {
        const start = new Date(runningStart);
        const end = new Date(start.getTime() + item.durationMins * 60 * 1000);
        // Advance runningStart for the next sequential service
        runningStart = end;

        const componentsPayload = item.selectedComponents.map((c) => ({
          component_id: c.id,
          provider_id: item.provider?.isAny ? null : item.provider?.id || null,
          quantity: 1,
          price_at_booking: c.is_included ? 0 : Number(c.price) || 0,
          duration_mins: Number(c.duration_mins) || 0,
        }));

        return {
          service_id: item.service.id,
          service_variant_id: item.variant?.id || null,
          provider_id: item.provider?.isAny ? null : item.provider?.id || null,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          components: componentsPayload,
          notes: item.notes || customerNotes.trim() || null,
        };
      });

      // RFC4122 v4 UUID generator for booking_group_id
      const groupId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });

      const createdBookings = await createMultiServiceBookings({
        company_id: companyId,
        user_name: customerName.trim(),
        phone_number: customerPhone.trim(),
        booking_group_id: groupId,
        notes: customerNotes.trim() || null,
        bookings: bookingEntries,
      });

      if (!createdBookings || createdBookings.length === 0) {
        throw new Error("Failed to create bookings.");
      }

      const primaryBooking = createdBookings[0];

      if (requiresPrepayment && totalPrepaymentAmount > 0) {
        toast.info(
          `Appointments reserved! Combined prepayment deposit of ${totalPrepaymentAmount.toLocaleString()} ETB required.`
        );
        const resolvedCompany = (items[0].service.company || {
          id: companyId,
          name: companyName || "Company",
          bank_accounts: [],
        }) as unknown as Company;

        setPendingBookingGroup({
          groupId,
          primaryBooking,
          totalPrepayment: totalPrepaymentAmount,
          company: resolvedCompany,
          serviceNames: items.map((i) => i.service.name),
        });
        setPaymentModalOpen(true);
        setIsCartOpen(false);
        clearCart();
      } else {
        toast.success(
          `Successfully booked ${createdBookings.length} ${
            createdBookings.length === 1 ? "service" : "services"
          }!`
        );
        clearCart();
        setIsCartOpen(false);
        router.push(`/booking/confirmation/${primaryBooking.id}`);
      }
    } catch (err: any) {
      console.error("Multi-service booking error:", err);
      toast.error(err.message || "Failed to confirm multi-service booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const ReviewContent = isBookingPage ? "section" : DialogContent;
  const reviewContent = (
    <ReviewContent
      className={cn(
        isBookingPage
          ? "w-full rounded-2xl border border-amber-200 bg-white p-4 shadow-sm dark:border-amber-900 dark:bg-slate-900 sm:p-6"
          : "max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl"
      )}
    >
      <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <DialogTitle className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
              Review Selected Services
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">
              {items.length} {items.length === 1 ? "service" : "services"}
              {companyName ? ` at ${companyName}` : ""}. Choose services first; no specialist selection is needed.
            </DialogDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isBookingPage && (
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                Back to services
              </button>
            )}
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer p-1"
            >
              Clear All
            </button>
          </div>
        </div>
      </DialogHeader>

      {/* Selected Services List */}
      <div className="space-y-4 py-3">
        {items.map((item, idx) => {
          const isExpanded = expandedItemId === item.cartItemId;
          const primaryPhoto =
            item.service.photo || item.service.service_photos?.[0]?.url;
          const availableAddons = (item.service.components || []).filter(
            (component) =>
              component.component_type === "addon" &&
              component.is_active !== false &&
              !component.is_required
          );
          const selectedAddonCount = item.selectedComponents.filter(
            (component) => component.component_type === "addon" && !component.is_required
          ).length;
          const hasAvailableComps = availableAddons.length > 0;

          return (
            <div
              key={item.cartItemId}
              className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3"
            >
              {/* Item Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-xl bg-amber-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shrink-0 overflow-hidden flex items-center justify-center">
                    {primaryPhoto ? (
                      <Image
                        src={primaryPhoto}
                        alt={item.service.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Icon
                        icon="solar:scissors-bold"
                        className="w-6 h-6 text-amber-600"
                      />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                        {item.service.name}
                      </h4>
                      {item.variant && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                          {item.variant.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.provider?.name || "First Available Specialist"} ·{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {item.durationMins} mins
                      </span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    {item.priceBreakdown.finalPrice?.toLocaleString()} ETB
                  </div>
                  {item.priceBreakdown.hasDiscount && (
                    <div className="text-[11px] text-slate-400 line-through">
                      {item.priceBreakdown.originalPrice?.toLocaleString()} ETB
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(item.cartItemId)}
                    className="text-xs text-rose-500 hover:text-rose-700 font-semibold mt-1 inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    <Icon icon="solar:trash-bin-trash-linear" className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              {hasAvailableComps && (
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedItemId(isExpanded ? null : item.cartItemId)
                    }
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>
                      {selectedAddonCount > 0
                        ? `${selectedAddonCount} add-on${selectedAddonCount === 1 ? "" : "s"} selected`
                        : "Choose add-ons"}
                    </span>
                    <Icon
                      icon={
                        isExpanded
                          ? "solar:alt-arrow-up-linear"
                          : "solar:alt-arrow-down-linear"
                      }
                      className="w-3.5 h-3.5"
                    />
                  </button>

                  {isExpanded && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-700 space-y-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                        Optional add-ons:
                      </span>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {availableAddons.map((comp) => {
                          const isSelected = item.selectedComponents.some(
                            (component) => component.id === comp.id
                          );

                          return (
                            <button
                              type="button"
                              key={comp.id}
                              onClick={() => handleToggleAddon(item, comp)}
                              aria-pressed={isSelected}
                              className={cn(
                                "w-full p-3 rounded-xl border text-xs flex items-center justify-between gap-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                                isSelected
                                  ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700"
                                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                                    isSelected
                                      ? "border-amber-600 bg-amber-600 text-white"
                                      : "border-slate-300 dark:border-slate-600"
                                  )}
                                >
                                  {isSelected && (
                                    <Icon icon="akar-icons:check" className="w-3 h-3" />
                                  )}
                                </span>
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-900 dark:text-white truncate">
                                    {comp.name}
                                  </span>
                                  {comp.is_overlappable && (
                                    <span className="ml-1.5 rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold text-sky-700">
                                      Concurrent
                                    </span>
                                  )}
                                  <span className="block text-[11px] text-slate-400">
                                    {comp.duration_mins} mins
                                  </span>
                                </div>
                              </div>
                              <span className="font-bold text-right shrink-0">
                                {comp.is_included
                                  ? "Included"
                                  : Number(comp.price) === 0
                                  ? "Free"
                                  : `+${Number(comp.price)} ETB`}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
        <div className="flex justify-between text-slate-500">
          <span>Combined Base Services</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {totalOriginalPrice.toLocaleString()} ETB
          </span>
        </div>
        {totalDiscountAmount > 0 && (
          <div className="flex justify-between text-amber-600">
            <span>Total Promotions / Discounts</span>
            <span className="font-bold">
              -{totalDiscountAmount.toLocaleString()} ETB
            </span>
          </div>
        )}
        <div className="flex justify-between text-slate-500">
          <span>Estimated Elapsed Appointment Time</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {totalDurationMins} minutes
          </span>
        </div>
        <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm">
          <span className="font-black text-slate-900 dark:text-white">
            Combined Total
          </span>
          <span className="font-black text-lg text-slate-900 dark:text-white">
            {totalPrice.toLocaleString()} ETB
          </span>
        </div>
        {requiresPrepayment && totalPrepaymentAmount > 0 && (
          <div className="mt-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-300/80 dark:border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
                Required Prepayment Deposit
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Single combined transfer for {items.length} services
              </span>
            </div>
            <span className="text-base font-black text-amber-600 dark:text-amber-400">
              {totalPrepaymentAmount.toLocaleString()} ETB
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-2">
        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Your Contact Information
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="e.g. Sara Abebe"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              placeholder="e.g. 0911223344"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
              Preferred Date <span className="text-rose-500">*</span>
            </label>
            <span className="rounded-lg bg-amber-50 px-3 py-2 text-right text-[11px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <span className="block">
                {formatEthiopian(parseISO(selectedDate), {
                  locale: "am",
                  includeWeekday: true,
                })}
              </span>
              <span className="block text-slate-600 dark:text-slate-300">
                {format(parseISO(selectedDate), "EEEE, MMMM d, yyyy")}
              </span>
            </span>
          </div>
          <div className="rounded-2xl border border-slate-200 p-2 dark:border-slate-700">
            <DualCalendarPicker
              selectedDate={parseISO(selectedDate)}
              onSelect={(date) => {
                if (date) setSelectedDate(format(date, "yyyy-MM-dd"));
              }}
              disabled={(date) =>
                isPast(startOfDay(date)) && !isSameDay(date, new Date())
              }
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
            Notes / Special Requests (Optional)
          </label>
          <input
            type="text"
            value={customerNotes}
            onChange={(event) => setCustomerNotes(event.target.value)}
            placeholder="e.g. Same specialist for acrylic and manicure if possible"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleAddMoreServices}
          className="w-full sm:w-auto min-h-11 px-5 py-2.5 rounded-full border border-slate-200 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-bold text-xs cursor-pointer text-center"
        >
          Choose another service
        </button>
        <button
          type="button"
          onClick={handleConfirmMultiBooking}
          disabled={isSubmitting}
          className="w-full sm:w-auto min-h-11 px-7 py-2.5 rounded-full bg-[#0f2937] hover:bg-black text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
              <span>Reserving All Appointments...</span>
            </>
          ) : (
            <>
              <span>Confirm All ({items.length}) Appointments</span>
              <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-emerald-400" />
            </>
          )}
        </button>
      </div>
    </ReviewContent>
  );

  return (
    <>
      <Dialog open={isCartOpen && !isBookingPage} onOpenChange={setIsCartOpen}>
        {isCartOpen &&
          (isBookingPage
            ? inlineTarget
              ? createPortal(reviewContent, inlineTarget)
              : null
            : reviewContent)}
      </Dialog>


    {pendingBookingGroup && (
      <PaymentVerificationModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        booking={pendingBookingGroup.primaryBooking}
        bookingGroupId={pendingBookingGroup.groupId}
        totalPrepaymentAmount={pendingBookingGroup.totalPrepayment}
        serviceNames={pendingBookingGroup.serviceNames}
        company={pendingBookingGroup.company}
        onSuccess={() => {
          router.push(`/booking/confirmation/${pendingBookingGroup.primaryBooking.id}`);
        }}
      />
    )}
  </>
  );
}
