// profile/_components/QueueCard.tsx
"use client";
import { Badge }  from "@/components/ui/badge";
import { Clock3, Building2, Hash } from "lucide-react";
import { MiniStars, GhostStars } from "./Starrating";
import type { CompanyRating, RatingSourceType } from "../hook/Useratings";
import type { QueueItem } from "@/type";

function statusConfig(s?: string) {
  switch (s) {
    case "waiting":    return { variant: "secondary"   as const, bar: "bg-yellow-400",  bg: "bg-yellow-50"  };
    case "serving":    return { variant: "default"     as const, bar: "bg-blue-400",    bg: "bg-blue-50"    };
    case "served":
    case "completed":  return { variant: "outline"     as const, bar: "bg-emerald-400", bg: "bg-emerald-50" };
    case "cancelled":  return { variant: "destructive" as const, bar: "bg-red-400",     bg: "bg-red-50"     };
    default:           return { variant: "secondary"   as const, bar: "bg-gray-300",    bg: "bg-gray-50"    };
  }
}

// Cast to string so TS doesn't complain about literal union overlap
function isRatable(status: unknown): boolean {
  const s = status as string;
  return s === "served" || s === "completed";
}

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
}

export function QueueCard({ entry: q, rating, onRateClick }: Props) {
  const qAny        = q as any;
  const companyName = qAny.company?.name || qAny.service?.company?.name || "Company";
  const companyId   = qAny.service?.company_id || qAny.service?.company?.id || "";
  const sourceId    = String(q.id);
  const canRate     = isRatable(q.status);
  const cfg         = statusConfig(q.status as string);

  return (
    <div className="group rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className={`h-1 w-full ${cfg.bar}`} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
            <Clock3 className="w-5 h-5 text-gray-600" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate text-sm">{qAny.service?.name || "Service"}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
              <p className="text-xs text-gray-500 truncate">{companyName}</p>
            </div>
            <p className="text-xs text-gray-400 mt-1">{new Date(q.joined_at).toLocaleString()}</p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge variant={cfg.variant} className="text-[10px] px-2">{q.status}</Badge>
            {q.position != null && (
              <div className="flex items-center gap-0.5 text-xs text-gray-400">
                <Hash className="w-3 h-3" />
                <span>{q.position}</span>
              </div>
            )}
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
                  onClick={() => onRateClick("queue", sourceId, companyId, companyName, rating)}
                  className="text-xs text-amber-500 hover:text-amber-600 font-medium"
                >
                  Edit
                </button>
              </div>
            ) : (
              <button
                onClick={() => onRateClick("queue", sourceId, companyId, companyName, null)}
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