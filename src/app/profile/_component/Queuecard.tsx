"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import type { CompanyRating, RatingSourceType } from "../hook/Useratings";
import type { QueueItem } from "@/type";
import { getEthiopianDate } from "@/lib/ethiopian-calendar";

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
  const companyName = qAny.company?.name || qAny.service?.company?.name || "Service Company";
  const serviceName = qAny.service?.name || "Walk-in Queue";
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

  const position = q.position ?? 1;
  const totalInLine = qAny.total_in_line ?? (position + 4);
  const estWaitMins = qAny.estimated_wait_time_mins ?? (position * 10);

  // Joined Date parsing
  const joinedDate = new Date(q.joined_at || Date.now());
  const monthAbbr = joinedDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const dayNum = joinedDate.getDate();
  const ethDate = getEthiopianDate(joinedDate);
  const ethDateFormatted = `${ethDate.monthNameAm} ${ethDate.day}`;

  const joinedTime = joinedDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        
        {/* Left: Date/Badge Box + Title Details */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {/* Badge Box */}
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

          {/* Service Title, Company, Status Banner */}
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight truncate">
              {serviceName}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 font-normal mt-0.5 truncate">
              {companyName} · Joined at {joinedTime}
            </p>

            {/* Live Queue Highlight Box */}
            {isLive && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/70 dark:border-teal-900/40 text-[11px] sm:text-xs text-teal-900 dark:text-teal-200 font-medium">
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse shrink-0" />
                <span>
                  <strong className="text-teal-950 dark:text-teal-100">#{position}</strong> of {totalInLine} in line · est. wait{" "}
                  <strong>{estWaitMins} min</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Status Badge & Actions */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-dashed border-slate-100 dark:border-slate-800">
          {/* Status Badge */}
          <div>
            {isLive && (
              <span className="bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block">
                In queue
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

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end mt-1 sm:mt-2">
            {isLive && (
              <button
                type="button"
                onClick={() => onLeaveQueue && onLeaveQueue(q)}
                className="border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-bold text-xs px-4 py-2 rounded-2xl transition-colors cursor-pointer"
              >
                Leave queue
              </button>
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
                      onClick={() => onRateClick("queue", sourceId, companyId, companyName, rating)}
                      className="ml-1 text-[11px] text-slate-400 hover:text-slate-600 font-semibold underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRateClick("queue", sourceId, companyId, companyName, null)}
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
                Join again
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}