"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { EthiopianCalendar } from "@/components/ui/ethiopian-calendar";
import { format, getDay, isPast, isSameDay, startOfDay } from "date-fns";
import type { AvailableSlot, Company, DailyWorkingHours } from "@/type";
import { parseWorkingHours } from "@/lib/booking-utils";
import { formatEthiopian, formatDualDate } from "@/lib/ethiopian-calendar";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface AppointmentSchedulerProps {
  company: Company;
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  slotsLoading: boolean;
  availableSlots: AvailableSlot[];
  onSlotClick: (slot: AvailableSlot) => void;
  isProviderSelected: boolean;
}

export default function AppointmentScheduler({
  company,
  selectedDate,
  onDateSelect,
  slotsLoading,
  availableSlots,
  onSlotClick,
  isProviderSelected,
}: AppointmentSchedulerProps) {
  const [calendarMode, setCalendarMode] = useState<"ethiopian" | "gregorian">("ethiopian");

  const disabledDays = (date: Date) =>
    isPast(startOfDay(date)) && !isSameDay(date, new Date());

  const getWorkingHoursForDay = () => {
    if (!company.working_hours || !selectedDate) return "Closed";
    if (typeof company.working_hours !== "object" || company.working_hours === null) {
      return "Closed";
    }
    const parsedHours = parseWorkingHours(company.working_hours);
    const dayOfWeek = getDay(selectedDate);
    const ranges = parsedHours[dayOfWeek];

    if (ranges && ranges.length > 0) {
      return ranges
        .map(
          (r: DailyWorkingHours) =>
            `${format(r.start, "h:mm a")} – ${format(r.end, "h:mm a")}`
        )
        .join(", ");
    }
    return "Closed";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ── Left: Calendar (5 Cols) ── */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-none">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Icon icon="solar:calendar-bold" className="w-4 h-4 text-amber-500" />
            <span>1. Select Date</span>
          </label>

          {/* Calendar Type Switcher (Ethiopian / Gregorian) */}
          <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setCalendarMode("ethiopian")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1",
                calendarMode === "ethiopian"
                  ? "bg-[#0f2937] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <span>🇪🇹 ኢትዮጵያ</span>
            </button>
            <button
              type="button"
              onClick={() => setCalendarMode("gregorian")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1",
                calendarMode === "gregorian"
                  ? "bg-[#0f2937] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <span>🌐 Gregorian</span>
            </button>
          </div>
        </div>
        
        <div className="flex justify-center">
          {calendarMode === "ethiopian" ? (
            <EthiopianCalendar
              selected={selectedDate}
              onSelect={onDateSelect}
              disabled={disabledDays}
              className="rounded-2xl border border-slate-100 dark:border-slate-800 p-2"
            />
          ) : (
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onDateSelect}
              initialFocus
              disabled={disabledDays}
              className="rounded-2xl border border-slate-100 dark:border-slate-800 p-2"
            />
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
          <Icon icon="solar:clock-circle-linear" className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Hours: {getWorkingHoursForDay()}</span>
        </div>
      </div>

      {/* ── Right: Available Slots (7 Cols) ── */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-none min-h-[360px] flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Icon icon="solar:clock-circle-bold" className="w-4 h-4 text-amber-500" />
            <span>2. Select Time Slot</span>
          </label>
          <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md self-start sm:self-auto border border-amber-200/60 dark:border-amber-900/60">
            {selectedDate ? (
              calendarMode === "ethiopian"
                ? `${formatEthiopian(selectedDate, { locale: "am", includeWeekday: true })} · (${format(selectedDate, "MMM d, yyyy")})`
                : `${format(selectedDate, "EEE, MMM d, yyyy")} · (${formatEthiopian(selectedDate, { locale: "am" })})`
            ) : (
              "Choose a date"
            )}
          </span>
        </div>

        <div className="flex-1">
          {slotsLoading ? (
            <div className="h-56 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <div className="w-8 h-8 border-2 border-slate-300 border-t-amber-500 rounded-full animate-spin"></div>
              <p className="text-xs font-medium">Checking available slots...</p>
            </div>
          ) : availableSlots.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                {availableSlots.length} available slots on this day. Select one to confirm:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.start.toISOString()}
                    type="button"
                    onClick={() => onSlotClick(slot)}
                    disabled={!isProviderSelected}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-none hover:shadow-2xs text-center active:scale-98"
                  >
                    {slot.formattedTime}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Icon icon="solar:calendar-cross-linear" className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                No slots available on this date
              </h4>
              <p className="text-xs max-w-xs text-slate-400">
                All appointments for this specialist are booked or the salon is closed. Please choose another date or join the live walk-in queue.
              </p>
            </div>
          )}
        </div>

        {!isProviderSelected && availableSlots.length > 0 && (
          <p className="text-xs text-rose-500 font-medium mt-3">
            * Please select a specialist above to book this slot.
          </p>
        )}
      </div>
    </div>
  );
}