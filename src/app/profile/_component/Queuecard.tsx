"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import type { CompanyRating, RatingSourceType } from "../hook/Useratings";
import type { QueueItem } from "@/type";
import { getCategoryIconInfo } from "@/lib/categoryIcons";

interface Props {
  entry: QueueItem;
  rating: CompanyRating | null;
  onRateClick: (
    sourceType: RatingSourceType,
    sourceId: string,
    companyId: string,
    companyName: string,
    existing: CompanyRating | null
  ) => void;
  onLeaveQueue?: (entry: QueueItem) => void;
}

export function QueueCard({ entry: q, rating, onRateClick, onLeaveQueue }: Props) {
  const router = useRouter();
  const qAny = q as any;
  const companyName = qAny.company?.name || qAny.service?.company?.name || "Cedar & Co. Barbershop";
  const serviceName = qAny.service?.name || "Haircut";
  const categoryName = qAny.service?.service_category?.name || qAny.service?.category?.name;
  const companyTypeName = qAny.company?.company_types?.[0]?.name;
  const companyId = qAny.service?.company_id || qAny.service?.company?.id || "";
  const serviceId = q.service_id || qAny.service?.id;
  const targetHref = serviceId
    ? `/booking/${serviceId}${companyId ? `?companyId=${companyId}` : ""}`
    : "/services";
  const sourceId = String(q.id);
  const status = (q.status || "waiting").toLowerCase();

  const isLive = status === "waiting" || status === "serving";
  const isCompleted = status === "served" || status === "completed";
  const isCancelled = status === "cancelled" || status === "noshow" || status === "left";

  const position = q.position ?? 3;
  const totalInLine = qAny.total_in_line ?? (position + 5);
  const estWaitMins = qAny.estimated_wait_time_mins ?? (position * 8);

  const joinedDate = new Date(q.joined_at || Date.now());
  const joinedTime = joinedDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const iconConfig = getCategoryIconInfo(serviceName, categoryName, companyTypeName);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all">
      {/* ── Top Row ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          {/* Category Icon */}
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${iconConfig.bg} flex items-center justify-center shrink-0 shadow-2xs`}
          >
            <Icon icon={iconConfig.icon} className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          {/* Name & Subtitle */}
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
              {companyName}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 font-normal mt-0.5">
              Walk-in · {serviceName}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="shrink-0">
          {isLive && (
            <span className="bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800 rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
              <span>Live</span>
            </span>
          )}
          {isCompleted && (
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
              Completed
            </span>
          )}
          {isCancelled && (
            <span className="bg-slate-100 text-slate-400 text-xs font-bold px-3 py-1 rounded-full">
              Cancelled
            </span>
          )}
        </div>
      </div>

      {/* ── Middle Highlighted Pill Box (Position & Est Wait) ── */}
      {isLive && (
        <div className="bg-[#F0F8FA] dark:bg-slate-800/60 border border-[#D9EEF3] dark:border-slate-700 rounded-2xl px-4 py-3 my-3 flex items-center">
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 flex items-baseline gap-1.5 flex-wrap">
            <span className="font-serif font-black text-xl sm:text-2xl text-[#0B3B48] dark:text-teal-300">
              #{position}
            </span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              of {totalInLine} in line · est. wait
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {estWaitMins} min
            </span>
          </p>
        </div>
      )}

      {/* ── Dotted Separator ── */}
      <div className="border-t border-dashed border-slate-200 dark:border-slate-800 my-3" />

      {/* ── Bottom Row: Joined Time & Action Buttons ── */}
      <div className="flex items-center justify-between gap-2">
        {/* Joined time */}
        <p className="text-xs text-slate-400 font-medium">
          Joined at {joinedTime}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isLive && (
            <button
              type="button"
              onClick={() => {
                if (onLeaveQueue) onLeaveQueue(q);
              }}
              className="border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-800 dark:text-rose-400 font-bold text-xs px-5 py-2 rounded-2xl transition-colors cursor-pointer"
            >
              Leave queue
            </button>
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
                    onClick={() => onRateClick("queue", sourceId, companyId, companyName, rating)}
                    className="ml-1 text-[11px] text-slate-400 hover:text-slate-600 font-medium underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onRateClick("queue", sourceId, companyId, companyName, null)}
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
              Join again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}