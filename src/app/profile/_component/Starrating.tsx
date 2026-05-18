// profile/_components/StarRating.tsx
"use client";
import { useState } from "react";

export const RATING_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Poor",      color: "text-red-500"     },
  2: { label: "Fair",      color: "text-orange-500"  },
  3: { label: "Good",      color: "text-yellow-500"  },
  4: { label: "Great",     color: "text-lime-500"    },
  5: { label: "Excellent", color: "text-emerald-500" },
};

function StarSvg({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor" strokeWidth="1.5"
      className={`transition-colors duration-150 ${
        filled ? "text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]" : "text-gray-300"
      }`}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

// ── Interactive picker ────────────────────────────────────────────
export function StarRating({
  value, onChange, readonly = false, size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const [hovered, setHovered] = useState(0);
  const px = { sm: 16, md: 28, lg: 40 }[size];
  return (
    <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s} type="button" disabled={readonly}
          onMouseEnter={() => !readonly && setHovered(s)}
          onClick={() => !readonly && onChange?.(s)}
          className={`transition-all duration-150 ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110 active:scale-95"}`}
          aria-label={`${s} star${s !== 1 ? "s" : ""}`}
        >
          <StarSvg filled={s <= (hovered || value)} size={px} />
        </button>
      ))}
    </div>
  );
}

// ── Tiny read-only display ────────────────────────────────────────
export function MiniStars({ stars }: { stars: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => <StarSvg key={s} filled={s <= stars} size={12} />)}
    </div>
  );
}

// ── Ghost stars (prompt-to-rate) ──────────────────────────────────
export function GhostStars() {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={14} height={14} viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.5"
          className="text-amber-400 group-hover:fill-amber-400 transition-colors"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}