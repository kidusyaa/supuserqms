"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { useBookingCart } from "@/context/BookingCartContext";
import { cn } from "@/lib/utils";

interface BookingSelectionBarProps {
  onOpenCheckout?: () => void;
}

export default function BookingSelectionBar({ onOpenCheckout }: BookingSelectionBarProps) {
  const pathname = usePathname();
  const {
    items,
    itemCount,
    totalPrice,
    totalOriginalPrice,
    totalDurationMins,
    totalDiscountAmount,
    clearCart,
    setIsCartOpen,
    companyName,
  } = useBookingCart();

  if (itemCount === 0 || pathname.startsWith("/booking/")) return null;

  const handleOpen = () => {
    if (onOpenCheckout) {
      onOpenCheckout();
    } else {
      setIsCartOpen(true);
    }
  };

  return (
    <aside
      aria-label="Booking selection"
      className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl p-2.5 sm:p-3 shadow-[0_8px_30px_rgba(15,23,42,0.16)] border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Summary */}
        <div className="flex items-center gap-2.5 min-w-0 pl-1">
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-sm shrink-0">
            <Icon icon="solar:cart-large-4-bold" className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-800 text-white text-[11px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900">
              {itemCount}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                {totalPrice.toLocaleString()} ETB
              </span>
              {totalDiscountAmount > 0 && (
                <span className="text-xs text-slate-400 line-through hidden sm:inline">
                  {totalOriginalPrice.toLocaleString()} ETB
                </span>
              )}
              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                · {totalDurationMins} mins
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {itemCount} {itemCount === 1 ? "service" : "services"} selected
              {companyName ? ` at ${companyName}` : ""}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={clearCart}
            title="Clear all selected services"
            className="p-2 sm:px-3 sm:py-2 rounded-full text-slate-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors cursor-pointer"
          >
            <span className="hidden sm:inline">Clear</span>
            <Icon icon="solar:trash-bin-trash-linear" className="w-4 h-4 sm:hidden" />
          </button>

          <button
            type="button"
            onClick={handleOpen}
            className="px-3.5 sm:px-5 py-2.5 rounded-full bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <span>Review &amp; book</span>
            <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
