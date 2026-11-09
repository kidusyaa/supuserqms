"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import type { CompanyRating, RatingSourceType } from "../hook/Useratings";
import type { Booking } from "@/type";
import { formatEthiopian, getEthiopianDate } from "@/lib/ethiopian-calendar";

interface Props {
  booking: Booking;
  rating: CompanyRating | null;
  onRateClick: (
    sourceType: RatingSourceType,
    sourceId: string,
    companyId: string,
    companyName: string,
    existing: CompanyRating | null
  ) => void;
  onCancelClick?: (booking: Booking) => void;
  onReuploadProof?: (booking: Booking) => void;
}

export function BookingCard({
  booking: b,
  rating,
  onRateClick,
  onCancelClick,
  onReuploadProof,
}: Props) {
  const router = useRouter();
  const companyName = b.company?.name || "Service Company";
  const serviceName = b.service?.name || "Appointment";
  const companyId = b.company_id || (b.service as any)?.company_id || (b.company as any)?.id || "";
  const serviceId = b.service_id || (b.service as any)?.id;
  const targetHref = serviceId
    ? `/booking/${serviceId}${companyId ? `?companyId=${companyId}` : ""}`
    : "/services";
  const status = (b.status || "confirmed").toLowerCase();

  const isCompleted = status === "completed" || status === "served";
  const isCancelled = status === "cancelled";
  const isUpcoming = !isCompleted && !isCancelled;
  const isPaymentPending = b.payment_status === "pending" || b.payment_status === "rejected";

  // Date Parsing
  const startDate = new Date(b.start_time || Date.now());
  const monthAbbr = startDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const dayNum = startDate.getDate();
  const ethDate = getEthiopianDate(startDate);
  const ethDateFormatted = `${ethDate.monthNameAm} ${ethDate.day}`;

  const timeStr = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const locationText =
    b.company?.location_text?.split(",")?.[0]?.trim() ||
    b.company?.address?.split(",")?.[0]?.trim() ||
    "Addis Ababa";

  const price = b.service?.price || (b as any).final_price || (b as any).price || "0";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        
        {/* Left: Date Badge Box + Title Details */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {/* Date Badge Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-2xl w-14 sm:w-16 p-2 text-center flex flex-col items-center justify-center shrink-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none">
              {monthAbbr}
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white my-0.5 leading-none">
              {dayNum < 10 ? `0${dayNum}` : dayNum}
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium truncate max-w-full leading-none">
              {ethDateFormatted}
            </span>
          </div>

          {/* Service Title, Company, Location & Time */}
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight truncate">
              {serviceName}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 font-normal mt-0.5 truncate">
              {companyName} · {locationText} · {timeStr}
            </p>

            {/* Payment Verification Callout Banner */}
            {isPaymentPending && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/40 text-[11px] sm:text-xs text-amber-800 dark:text-amber-300 font-medium">
                <Icon icon="solar:info-circle-linear" className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span>
                  {b.payment_status === "rejected"
                    ? "Receipt rejected. Please upload a clear transfer receipt."
                    : "Upload your Telebirr or CBE receipt to confirm."}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Price, Status Badge & Action Buttons */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-dashed border-slate-100 dark:border-slate-800">
          {/* Price & Status Badge */}
          <div className="text-left sm:text-right">
            <div className="font-black text-base text-slate-900 dark:text-white leading-tight">
              {isCancelled ? (
                <span className="line-through text-slate-400">{price} ETB</span>
              ) : (
                <span>{price} ETB</span>
              )}
            </div>

            <div className="mt-1">
              {b.payment_status === "pending" && (
                <span className="bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block">
                  Payment pending
                </span>
              )}
              {b.payment_status === "rejected" && (
                <span className="bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block">
                  Payment rejected
                </span>
              )}
              {!isPaymentPending && isUpcoming && (
                <span className="bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block">
                  Upcoming
                </span>
              )}
              {isCompleted && (
                <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block">
                  Completed
                </span>
              )}
              {isCancelled && (
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block">
                  Cancelled
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end mt-1 sm:mt-2">
            {isPaymentPending && (
              <>
                <button
                  type="button"
                  onClick={() => onReuploadProof && onReuploadProof(b)}
                  className="bg-[#FBA819] hover:bg-amber-500 active:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-2xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Icon icon="solar:camera-bold" className="w-3.5 h-3.5 text-slate-950" />
                  <span>Verify payment</span>
                </button>

                {isUpcoming && (
                  <>
                    <button
                      type="button"
                      onClick={() => onCancelClick && onCancelClick(b)}
                      className="border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-bold text-xs px-3.5 py-2 rounded-2xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/booking/confirmation/${b.id}`)}
                      className="border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs px-3.5 py-2 rounded-2xl transition-colors cursor-pointer"
                    >
                      Details
                    </button>
                  </>
                )}
              </>
            )}

            {!isPaymentPending && isUpcoming && (
              <>
                <button
                  type="button"
                  onClick={() => onCancelClick && onCancelClick(b)}
                  className="border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-bold text-xs px-3.5 py-2 rounded-2xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/booking/confirmation/${b.id}`)}
                  className="bg-[#0B3B48] hover:bg-[#07252d] text-white font-bold text-xs px-4 py-2 rounded-2xl shadow-xs transition-all cursor-pointer"
                >
                  Details
                </button>
              </>
            )}

            {isCompleted && (
              <>
                {rating ? (
                  <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                    {[...Array(5)].map((_, i) => (
                      <Icon
                        key={i}
                        icon="solar:star-bold"
                        className={`w-3.5 h-3.5 ${i < rating.stars ? "text-amber-500" : "text-slate-200 dark:text-slate-600"}`}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => onRateClick("booking", b.id, b.company_id, companyName, rating)}
                      className="ml-1 text-[11px] text-slate-400 hover:text-slate-600 font-semibold underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRateClick("booking", b.id, b.company_id, companyName, null)}
                    className="bg-[#FBA819] hover:bg-amber-500 active:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-2xl shadow-xs transition-all cursor-pointer"
                  >
                    Rate service
                  </button>
                )}
              </>
            )}

            {isCancelled && (
              <button
                type="button"
                onClick={() => router.push(targetHref)}
                className="border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs px-4 py-2 rounded-2xl transition-colors cursor-pointer"
              >
                Book again
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}