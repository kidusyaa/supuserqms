// profile/_components/BookingCard.tsx
"use client";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Calendar, Building2, ChevronRight, Star } from "lucide-react";
import { MiniStars, GhostStars } from "./Starrating";
import type { CompanyRating, RatingSourceType } from "../hook/Useratings";
import type { Booking } from "@/type";
import { motion } from "framer-motion";

function statusConfig(s?: string) {
  switch (s) {
    case "confirmed":
      return { variant: "default" as const, bar: "bg-cyan-500", bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" };
    case "pending":
      return { variant: "secondary" as const, bar: "bg-amber-500", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
    case "cancelled":
      return { variant: "destructive" as const, bar: "bg-rose-500", bg: "bg-rose-500/10 text-rose-400 border-rose-500/20" };
    case "completed":
      return { variant: "outline" as const, bar: "bg-emerald-500", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
    default:
      return { variant: "secondary" as const, bar: "bg-slate-500", bg: "bg-slate-500/10 text-slate-400 border-slate-500/20" };
  }
}

function isRatable(status: unknown): boolean {
  const s = status as string;
  return s === "completed" || s === "served";
}

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
}

export function BookingCard({ booking: b, rating, onRateClick }: Props) {
  const router = useRouter();
  const companyName = b.company?.name || "Company";
  const canRate = isRatable(b.status);
  const cfg = statusConfig(b.status as string);

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.005 }}
      transition={{ duration: 0.2 }}
      className="group relative rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 backdrop-blur-md shadow-sm hover:shadow-md hover:border-violet-500/25 transition-all overflow-hidden flex"
    >
      {/* Dynamic Status Vertical Line */}
      <div className={`w-[4px] shrink-0 ${cfg.bar}`} />

      <div className="flex-1 p-4 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Calendar Icon Widget */}
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </div>

            <div className="min-w-0">
              <p className="font-bold text-slate-900 dark:text-white truncate text-sm">
                {b.service?.name || "Service"}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{companyName}</p>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-mono">
                {new Date(b.start_time).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 shrink-0">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.bg}`}>
              {b.status}
            </span>
            <button
              onClick={() => router.push(`/booking/confirmation/${b.id}`)}
              className="flex items-center gap-0.5 text-xs font-semibold text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors cursor-pointer group"
            >
              Details 
              <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Action Rating Panel */}
        {canRate && (
          <div className="mt-3.5 pt-3.5 border-t border-dashed border-slate-100 dark:border-slate-850/40">
            {rating ? (
              <div className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 p-2 rounded-xl border border-slate-100/40 dark:border-slate-800/20">
                <div className="flex items-center gap-2 min-w-0">
                  <MiniStars stars={rating.stars} />
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-400 truncate max-w-[200px] italic">
                    {rating.review ? `"${rating.review}"` : "Rated"}
                  </span>
                </div>
                <button
                  onClick={() => onRateClick("booking", b.id, b.company_id, companyName, rating)}
                  className="text-xs font-bold text-violet-500 hover:text-violet-600 cursor-pointer"
                >
                  Edit Review
                </button>
              </div>
            ) : (
              <button
                onClick={() => onRateClick("booking", b.id, b.company_id, companyName, null)}
                className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors group/rate"
              >
                <div className="flex text-slate-300 group-hover/rate:text-amber-400 transition-colors">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                </div>
                <span>Write a review for {companyName}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}