"use client";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format, getDay, isPast, isSameDay, startOfDay } from "date-fns";
import type { AvailableSlot, Company, DailyWorkingHours } from "@/type";
import { parseWorkingHours } from "@/lib/booking-utils";

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
  const disabledDays = (date: Date) => isPast(startOfDay(date)) && !isSameDay(date, new Date());

  const getWorkingHoursForDay = () => {
    if (!company.working_hours || !selectedDate) return "Closed";
    if (typeof company.working_hours !== 'object' || company.working_hours === null) {
      return "Closed (Invalid hours)";
    }
    const parsedHours = parseWorkingHours(company.working_hours);
    const dayOfWeek = getDay(selectedDate);
    const ranges = parsedHours[dayOfWeek];

    if (ranges && ranges.length > 0) {
      return ranges
        .map((r: DailyWorkingHours) => `${format(r.start, "h:mm a")} - ${format(r.end, "h:mm a")}`)
        .join(", ");
    }
    return "Closed";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Select a Date</h3>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          initialFocus
          disabled={disabledDays}
          className="rounded-md border shadow"
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Available Slots for {selectedDate ? format(selectedDate, "PPP") : "N/A"}
        </h3>
        <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-2">
          {slotsLoading ? (
            <div className="col-span-3 text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading slots...</p>
            </div>
          ) : availableSlots.length > 0 ? (
            availableSlots.map((slot) => (
              <Button
                key={slot.start.toISOString()}
                variant="outline"
                onClick={() => onSlotClick(slot)}
                disabled={!isProviderSelected}
              >
                {slot.formattedTime}
              </Button>
            ))
          ) : (
            <div className="col-span-3 text-center py-4 text-muted-foreground">
              <p>No appointment slots available for this day.</p>
              <p className="text-sm mt-1">Please select another date or join the queue.</p>
              <p className="text-xs mt-2">Working hours today: {getWorkingHoursForDay()}</p>
            </div>
          )}
        </div>
        {!isProviderSelected && availableSlots.length > 0 && (
          <p className="text-sm text-red-500 mt-4">Please select a provider to book a slot.</p>
        )}
      </div>
    </div>
  );
}