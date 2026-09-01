"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import type { CompanyRating, RatingSourceType } from "../hook/Useratings";
import type { Booking } from "@/type";
import { getCategoryIconInfo } from "@/lib/categoryIcons";

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
  const companyName = b.company?.name || "Cedar & Co. Barbershop";
  const serviceName = b.service?.name || "Haircut + Beard Trim";
  const companyId = b.company_id || (b.service as any)?.company_id || (b.company as any)?.id || "";
  const serviceId = b.service_id || (b.service as any)?.id;
  const targetHref = serviceId
    ? `/booking/${serviceId}${companyId ? `?companyId=${companyId}` : ""}`
    : "/services";
  const status = (b.status || "confirmed").toLowerCase();

  const isCompleted = status === "completed" || status === "served";
  const isCancelled = status === "cancelled";
  const isUpcoming = !isCompleted && !isCancelled;

  // Format date and time
  const startDate = new Date(b.start_time || Date.now());
  const now = new Date();
  const isTomorrow =
    startDate.getDate() === now.getDate() + 1 &&
    startDate.getMonth() === now.getMonth() &&
    startDate.getFullYear() === now.getFullYear();

  let formattedDate = "";
  if (isTomorrow) {
    formattedDate = `Tomorrow · ${startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  } else {
    formattedDate = `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  }

  const locationText = b.company?.location_text?.split(",")?.[0]?.trim() || 
                       b.company?.address?.split(",")?.[0]?.trim() || 
                       "Bole";

  const price = b.service?.price || (b as any).price || "420";
  const iconConfig = getCategoryIconInfo(
    serviceName,
    (b.service as any)?.service_category?.name || (b.service as any)?.category?.name,
    b.company?.company_types?.[0]?.name
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all">
      {/* ── Top Details Row ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          {/* Category Icon */}
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${iconConfig.bg} flex items-center justify-center shrink-0 shadow-2xs`}
          >
            <Icon icon={iconConfig.icon} className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          {/* Name, Service & Time Info */}
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
              {companyName}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 font-normal mt-0.5">
              {serviceName}
            </p>
            <p className="text-xs text-slate-400 font-normal mt-1">
              {formattedDate} &nbsp;{locationText ? `${locationText}` : ""}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="shrink-0 flex items-center gap-1.5 flex-wrap justify-end">
          {b.payment_status === "pending" && (
            <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              Payment Pending
            </span>
          )}
          {b.payment_status === "rejected" && (
            <span className="bg-rose-500/10 text-rose-600 border border-rose-500/20 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              Payment Rejected
            </span>
          )}
          {b.payment_status === "approved" && (
            <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              Deposit Paid
            </span>
          )}
          {isUpcoming && (
            <span className="bg-amber-100/70 text-amber-800 text-xs font-bold px-3.5 py-1 rounded-full">
              Upcoming
            </span>
          )}
          {isCompleted && (
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3.5 py-1 rounded-full">
              Completed
            </span>
          )}
          {isCancelled && (
            <span className="bg-slate-100 text-slate-400 text-xs font-bold px-3.5 py-1 rounded-full">
              Cancelled
            </span>
          )}
        </div>
      </div>

      {/* ── Dotted Separator Line ── */}
      <div className="border-t border-dashed border-slate-200 dark:border-slate-800 my-3.5" />

      {/* ── Bottom Row: Price & Actions ── */}
      <div className="flex items-center justify-between gap-2">
        {/* Price */}
        <div>
          {isCancelled ? (
            <span className="line-through text-slate-400 font-black text-base">
              {price} ETB
            </span>
          ) : (
            <span className="font-black text-base text-slate-900 dark:text-white">
              {price} ETB
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {b.payment_status === "rejected" && (
            <button
              type="button"
              onClick={() => onReuploadProof && onReuploadProof(b)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-2xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Icon icon="solar:restart-bold" className="w-3.5 h-3.5" />
              <span>Re-upload Receipt</span>
            </button>
          )}

          {b.payment_status === "pending" && (
            <button
              type="button"
              onClick={() => onReuploadProof && onReuploadProof(b)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-2xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Icon icon="solar:camera-bold" className="w-3.5 h-3.5" />
              <span>Verify Payment</span>
            </button>
          )}

          {isUpcoming && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (onCancelClick) onCancelClick(b);
                }}
                className="border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-800 dark:text-rose-400 font-bold text-xs px-5 py-2 rounded-2xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => router.push(`/booking/confirmation/${b.id}`)}
                className="border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#0B3B48] dark:text-teal-300 font-bold text-xs px-5 py-2 rounded-2xl transition-colors cursor-pointer"
              >
                Details
              </button>
            </>
          )}

          {isCompleted && (
            <>
              {rating ? (
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Icon
                      key={i}
                      icon="solar:star-bold"
                      className={`w-4 h-4 ${i < rating.stars ? "text-amber-500" : "text-slate-200"}`}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => onRateClick("booking", b.id, b.company_id, companyName, rating)}
                    className="ml-1 text-[11px] text-slate-400 hover:text-slate-600 font-medium underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onRateClick("booking", b.id, b.company_id, companyName, null)}
                  className="bg-[#FBA819] hover:bg-amber-500 text-slate-950 font-bold text-xs px-5 py-2 rounded-2xl shadow-xs transition-all cursor-pointer"
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
              className="border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-xs px-5 py-2 rounded-2xl transition-colors cursor-pointer"
            >
              Book again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}