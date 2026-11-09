"use client";

import { useEffect, useState } from "react";
import { startOfMonth } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { EthiopianCalendar } from "@/components/ui/ethiopian-calendar";
import { cn } from "@/lib/utils";

interface DualCalendarPickerProps {
  selectedDate?: Date;
  onSelect: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
}

export default function DualCalendarPicker({
  selectedDate,
  onSelect,
  disabled,
}: DualCalendarPickerProps) {
  const [mobileCalendar, setMobileCalendar] = useState<"ethiopian" | "gregorian">(
    "ethiopian"
  );
  const [gregorianMonth, setGregorianMonth] = useState(
    startOfMonth(selectedDate || new Date())
  );

  useEffect(() => {
    if (selectedDate) setGregorianMonth(startOfMonth(selectedDate));
  }, [selectedDate]);

  const renderCalendar = (calendar: "ethiopian" | "gregorian") =>
    calendar === "ethiopian" ? (
      <EthiopianCalendar
        selected={selectedDate}
        onSelect={onSelect}
        disabled={disabled}
        className="max-w-none"
      />
    ) : (
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onSelect}
          month={gregorianMonth}
          onMonthChange={setGregorianMonth}
          disabled={disabled}
        />
      </div>
    );

  return (
    <div>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        Choose a date in either calendar. Both calendars and available times stay in sync.
      </p>
      <div className="hidden gap-3 lg:grid lg:grid-cols-2">
        {(["ethiopian", "gregorian"] as const).map((calendar) => (
          <section
            key={calendar}
            className="min-w-0 rounded-xl border border-slate-100 p-2 dark:border-slate-800"
          >
            <h3 className="mb-1 px-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              {calendar === "ethiopian" ? "Ethiopian calendar" : "Gregorian calendar"}
            </h3>
            {renderCalendar(calendar)}
          </section>
        ))}
      </div>
      <div className="lg:hidden">
        <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {(["ethiopian", "gregorian"] as const).map((calendar) => (
            <button
              key={calendar}
              type="button"
              onClick={() => setMobileCalendar(calendar)}
              aria-pressed={mobileCalendar === calendar}
              className={cn(
                "min-h-10 rounded-md px-2.5 py-2 text-xs font-bold",
                mobileCalendar === calendar
                  ? "bg-white text-amber-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 dark:text-slate-300"
              )}
            >
              {calendar === "ethiopian" ? "Ethiopian" : "Gregorian"}
            </button>
          ))}
        </div>
        <div className="flex justify-center overflow-x-auto">
          {renderCalendar(mobileCalendar)}
        </div>
      </div>
    </div>
  );
}
