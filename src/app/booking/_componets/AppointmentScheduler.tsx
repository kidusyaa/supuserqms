"use client";

import { useMemo, useState } from "react";
import DualCalendarPicker from "@/components/book/DualCalendarPicker";
import { addDays, format, getDay, isPast, isSameDay, startOfDay } from "date-fns";
import type { AvailableSlot, Company, DailyWorkingHours } from "@/type";
import { parseWorkingHours } from "@/lib/booking-utils";
import { formatEthiopian, getEthiopianDate } from "@/lib/ethiopian-calendar";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { LogoLoader } from "@/components/ui/LogoLoader";

interface AppointmentSchedulerProps {
  company: Company;
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  slotsLoading: boolean;
  availableSlots: AvailableSlot[];
  onSlotClick: (slot: AvailableSlot) => void;
  isProviderSelected: boolean;
  selectedSlot?: AvailableSlot | null;
}

export default function AppointmentScheduler({
  company,
  selectedDate,
  onDateSelect,
  slotsLoading,
  availableSlots,
  onSlotClick,
  isProviderSelected,
  selectedSlot,
}: AppointmentSchedulerProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const quickDates = useMemo(
    () => Array.from({ length: 5 }, (_, index) => addDays(startOfDay(new Date()), index)),
    []
  );

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
      <div className={cn(
        "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-none",
        showCalendar ? "lg:col-span-12" : "lg:col-span-5"
      )}>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Icon icon="solar:calendar-bold" className="w-4 h-4 text-amber-500" />
            <span>Select a date</span>
          </label>
          <button
            type="button"
            onClick={() => setShowCalendar((shown) => !shown)}
            aria-expanded={showCalendar}
            className="min-h-10 rounded-lg px-3 text-xs font-bold text-amber-800 hover:bg-amber-50 hover:text-amber-950 dark:text-amber-300 dark:hover:bg-amber-950/40"
          >
            {showCalendar ? "Close calendars" : "Choose another date"}
          </button>
        </div>

        <div className="grid grid-cols-5 gap-1.5 pb-1">
          {quickDates.map((date, index) => {
            const isSelected = Boolean(selectedDate && isSameDay(selectedDate, date));
            const ethiopianDate = getEthiopianDate(date);
            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => onDateSelect(date)}
                aria-pressed={isSelected}
                aria-label={`${index === 0 ? "Today" : format(date, "EEEE")}, ${format(date, "MMMM d, yyyy")} Gregorian, ${ethiopianDate.monthNameAm} ${ethiopianDate.day} ${ethiopianDate.year} Ethiopian`}
                className={cn(
                  "min-w-0 flex flex-col items-center justify-center rounded-xl border px-1 py-2 transition-colors",
                  isSelected
                    ? "border-[#ad741f] bg-[#ad741f] text-white shadow-sm"
                    : "border-amber-100 bg-white text-slate-700 hover:border-amber-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                )}
              >
                <span className={cn("text-[10px] font-medium", isSelected ? "text-white/80" : "text-slate-500")}>
                  {index === 0 ? "Today" : format(date, "EEE")}
                </span>
                <span className="mt-0.5 text-lg font-bold leading-none">{format(date, "d")}</span>
                <span className={cn("mt-1 text-[10px]", isSelected ? "text-white/80" : "text-slate-500")}>
                  {format(date, "MMM")}
                </span>
                <span className={cn("mt-1 max-w-full truncate text-[9px] leading-none", isSelected ? "text-white/90" : "text-amber-800 dark:text-amber-300")}>
                  {ethiopianDate.monthNameAm} {ethiopianDate.day}
                </span>
              </button>
            );
          })}
        </div>

        {showCalendar && (
          <div className="mt-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <DualCalendarPicker
              selectedDate={selectedDate}
              onSelect={onDateSelect}
              disabled={disabledDays}
            />
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
          <Icon icon="solar:clock-circle-linear" className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Hours: {getWorkingHoursForDay()}</span>
        </div>
      </div>

      {/* ── Right: Available Slots (7 Cols) ── */}
      <div className={cn(
        "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-none min-h-0 flex flex-col",
        showCalendar ? "lg:col-span-12" : "lg:col-span-7"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Icon icon="solar:clock-circle-bold" className="w-4 h-4 text-amber-500" />
            <span>Select a time</span>
          </label>
          <div className="self-start rounded-lg border border-amber-200/60 bg-amber-50 px-3 py-2 text-left dark:border-amber-900/60 dark:bg-amber-950/40 sm:self-auto sm:text-right">
            {selectedDate ? (
              <>
                <span className="block text-xs font-bold text-amber-800 dark:text-amber-300">
                  {formatEthiopian(selectedDate, { locale: "am", includeWeekday: true })}
                </span>
                <span className="mt-0.5 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </span>
              </>
            ) : (
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Choose a date
              </span>
            )}
          </div>
        </div>

        <div className="flex-1">
          {slotsLoading ? (
            <div className="h-56 flex flex-col items-center justify-center text-slate-400">
              <LogoLoader variant="flip" size="sm" text="Checking available slots..." />
            </div>
          ) : availableSlots.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                {availableSlots.length} available slots on this day. Select one to confirm:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot?.start.toISOString() === slot.start.toISOString();
                  return (
                    <button
                      key={slot.start.toISOString()}
                      type="button"
                      onClick={() => onSlotClick(slot)}
                      disabled={!isProviderSelected}
                      aria-pressed={isSelected}
                      className={cn(
                        "min-h-11 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-none text-center active:scale-98 flex items-center justify-center gap-1",
                        isSelected
                          ? "border-amber-500 bg-amber-500 text-white shadow-xs font-black ring-2 ring-amber-500/30"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                      )}
                    >
                      {isSelected && <Icon icon="akar-icons:check" className="w-3.5 h-3.5 shrink-0" />}
                      <span>{slot.formattedTime}</span>
                    </button>
                  );
                })}
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