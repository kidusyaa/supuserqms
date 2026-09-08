"use client";

import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  RotateCcwIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ETHIOPIAN_MONTHS_AMHARIC,
  ETHIOPIAN_MONTHS_ENGLISH,
  ETHIOPIAN_WEEKDAYS_SHORT_AMHARIC,
  getEthiopianDate,
  ethiopianToGregorianDate,
  getDaysInEthiopianMonth,
} from "@/lib/ethiopian-calendar";
import { isSameDay, startOfDay } from "date-fns";

export interface EthiopianCalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
  locale?: "am" | "en";
}

export function EthiopianCalendar({
  selected,
  onSelect,
  disabled,
  className,
  locale = "am",
}: EthiopianCalendarProps) {
  const today = React.useMemo(() => new Date(), []);
  const todayEth = React.useMemo(() => getEthiopianDate(today), [today]);

  const selectedEth = React.useMemo(() => {
    return selected ? getEthiopianDate(selected) : undefined;
  }, [selected]);

  // Active viewing month and year in Ethiopian Calendar
  const [viewYear, setViewYear] = React.useState<number>(
    selectedEth?.year || todayEth.year
  );
  const [viewMonth, setViewMonth] = React.useState<number>(
    selectedEth?.month || todayEth.month
  );

  // Sync viewing month when selected date changes externally
  React.useEffect(() => {
    if (selectedEth) {
      setViewYear(selectedEth.year);
      setViewMonth(selectedEth.month);
    }
  }, [selectedEth?.year, selectedEth?.month]);

  const daysInMonth = React.useMemo(() => {
    return getDaysInEthiopianMonth(viewYear, viewMonth);
  }, [viewYear, viewMonth]);

  // First day of this Ethiopian month in Gregorian
  const firstDayGregorian = React.useMemo(() => {
    return ethiopianToGregorianDate(viewYear, viewMonth, 1);
  }, [viewYear, viewMonth]);

  // Starting day index (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  // In Ethiopian calendar, week starts on Monday (ሰኞ = 0, እሑድ = 6) or standard Sunday (0)
  // Let's align to Monday start: (day + 6) % 7
  const startDayOffset = React.useMemo(() => {
    const rawDay = firstDayGregorian.getDay(); // 0 is Sunday
    return (rawDay + 6) % 7; // Monday = 0, Sunday = 6
  }, [firstDayGregorian]);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(13);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 13) {
      setViewMonth(1);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleToday = () => {
    setViewYear(todayEth.year);
    setViewMonth(todayEth.month);
    if (onSelect) {
      onSelect(startOfDay(today));
    }
  };

  const currentMonthName =
    locale === "am"
      ? ETHIOPIAN_MONTHS_AMHARIC[viewMonth - 1]
      : ETHIOPIAN_MONTHS_ENGLISH[viewMonth - 1];

  return (
    <div
      className={cn(
        "p-3 bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[340px] select-none",
        className
      )}
    >
      {/* Header: Month / Year / Navigation */}
      <div className="flex items-center justify-between gap-2 mb-3 px-1">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
            {currentMonthName}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200/50 dark:border-amber-800/50">
            {viewYear} {locale === "am" ? "ዓ.ም" : "E.C."}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleToday}
            title={locale === "am" ? "ዛሬ" : "Today"}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
          >
            <RotateCcwIcon className="size-3.5" />
            <span className="text-[11px] font-medium hidden sm:inline">
              {locale === "am" ? "ዛሬ" : "Today"}
            </span>
          </button>

          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Previous Month"
          >
            <ChevronLeftIcon className="size-4" />
          </button>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Next Month"
          >
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers: ሰኞ ... እሑድ */}
      <div className="grid grid-cols-7 mb-2 text-center">
        {["ሰኞ", "ማክ", "ረቡ", "ሐሙ", "ዓር", "ቅዳ", "እሑ"].map((wd, i) => (
          <div
            key={i}
            className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 py-1"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {/* Empty slots before first day */}
        {Array.from({ length: startDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Days of the Ethiopian Month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const ethDay = i + 1;
          const gDate = ethiopianToGregorianDate(viewYear, viewMonth, ethDay);
          const isTodayDate = isSameDay(gDate, today);
          const isSelectedDate = selected ? isSameDay(gDate, selected) : false;
          const isDisabledDate = disabled ? disabled(gDate) : false;

          return (
            <button
              key={ethDay}
              type="button"
              disabled={isDisabledDate}
              onClick={() => onSelect?.(startOfDay(gDate))}
              className={cn(
                "aspect-square rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-all cursor-pointer relative",
                isSelectedDate
                  ? "bg-[#0f2937] text-white font-bold shadow-xs scale-100 ring-2 ring-[#0f2937]/30 dark:ring-amber-500/40"
                  : isTodayDate
                  ? "bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-bold"
                  : "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
                isDisabledDate &&
                  "opacity-30 cursor-not-allowed hover:bg-transparent text-slate-400 dark:text-slate-600 line-through"
              )}
            >
              <span>{ethDay}</span>
              {/* Subtle indicator for Today */}
              {isTodayDate && !isSelectedDate && (
                <span className="w-1 h-1 rounded-full bg-amber-500 absolute bottom-1"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>
          {viewMonth === 13
            ? `ጳጉሜ (${daysInMonth} ቀናት)`
            : `${currentMonthName} · 30 ቀናት`}
        </span>
        <span className="text-amber-600 dark:text-amber-400 font-medium">
          የኢትዮጵያ ዘመን አቆጣጠር
        </span>
      </div>
    </div>
  );
}
