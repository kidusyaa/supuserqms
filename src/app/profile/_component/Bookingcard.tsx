// profile/_components/BookingCard.tsx
"use client";
import { useRouter } from "next/navigation";
import { Badge }  from "@/components/ui/badge";
import { Calendar, Building2, ChevronRight } from "lucide-react";
import { MiniStars, GhostStars } from "./Starrating";
import type { CompanyRating, RatingSourceType } from "../hook/Useratings";
import type { Booking } from "@/type";

function statusConfig(s?: string) {
  switch (s) {
    case "confirmed":  return { variant: "default"     as const, bar: "bg-blue-400",    bg: "bg-blue-50"    };
    case "pending":    return { variant: "secondary"   as const, bar: "bg-yellow-400",  bg: "bg-yellow-50"  };
    case "cancelled":  return { variant: "destructive" as const, bar: "bg-red-400",     bg: "bg-red-50"     };
    case "completed":  return { variant: "outline"     as const, bar: "bg-emerald-400", bg: "bg-emerald-50" };
    default:           return { variant: "secondary"   as const, bar: "bg-gray-300",    bg: "bg-gray-50"    };
  }
}

// Cast to string so TS doesn't complain about literal union overlap
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
  const router      = useRouter();
  const companyName = b.company?.name || "Company";
  const canRate     = isRatable(b.status);
  const cfg         = statusConfig(b.status as string);

  return (
    <div className="group rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className={`h-1 w-full ${cfg.bar}`} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
            <Calendar className="w-5 h-5 text-gray-600" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate text-sm">{b.service?.name || "Service"}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
              <p className="text-xs text-gray-500 truncate">{companyName}</p>
            </div>
            <p className="text-xs text-gray-400 mt-1">{new Date(b.start_time).toLocaleString()}</p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge variant={cfg.variant} className="text-[10px] px-2">{b.status}</Badge>
            <button
              onClick={() => router.push(`/booking/confirmation/${b.id}`)}
              className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-amber-500 transition-colors"
            >
              View <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {canRate && (
          <div className="mt-3 pt-3 border-t border-dashed border-gray-100">
            {rating ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MiniStars stars={rating.stars} />
                  <span className="text-xs text-gray-400">Your rating</span>
                  {rating.review && (
                    <span className="text-xs text-gray-400 truncate max-w-[100px]">· "{rating.review}"</span>
                  )}
                </div>
                <button
                  onClick={() => onRateClick("booking", b.id, b.company_id, companyName, rating)}
                  className="text-xs text-amber-500 hover:text-amber-600 font-medium"
                >
                  Edit
                </button>
              </div>
            ) : (
              <button
                onClick={() => onRateClick("booking", b.id, b.company_id, companyName, null)}
                className="flex items-center gap-2 text-xs text-amber-600 hover:text-amber-700 font-medium group/r"
              >
                <GhostStars />
                Rate {companyName}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}