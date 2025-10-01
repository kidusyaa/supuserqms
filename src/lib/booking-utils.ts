import {
  parse,
  isValid,
  addMinutes,
  isSameDay,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
  format,
  getDay, // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  parseISO,
} from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { Company, Service, Provider, WorkingHoursJsonb, ParsedWorkingHours, DailyWorkingHours, AvailableSlot  } from '@/type';

// Helper to normalize a date to start of day with consistent time
const getNormalizedDate = (date: Date): Date => {
  return setMilliseconds(setSeconds(setMinutes(setHours(date, 0), 0), 0), 0);
};

// --- REVISED HELPER FUNCTION TO STANDARDIZE TIME STRINGS ---
// This version will guarantee a "H:mm AM/PM" format for simple "Ham" / "Hpm" inputs.
function standardizeTimeInput(timeStr: string): string {
  const lowerTime = timeStr.toLowerCase().trim();
  const match = lowerTime.match(/^(\d+)(am|pm)$/); // Matches "8" and "am" or "pm"

  if (match && match.length === 3) {
    let hour = parseInt(match[1], 10);
    const ampm = match[2];

    // Ensure 12-hour format is consistent (e.g., 12am -> 12 AM, 12pm -> 12 PM)
    // `date-fns` 'h' format usually handles this, but being explicit.
    // We're converting to `H:mm AM/PM` to be parsed with `'h:mm a'`.
    return `${hour}:00 ${ampm.toUpperCase()}`; // Forces "8:00 AM" or "5:00 PM"
  }

  // If the string is already in a more complex format (e.g., "9:30 AM", "10:15pm"),
  // return it as is. The parse function will attempt to handle it with 'h:mm a'.
  return timeStr;
}


// --- Part 1: Parsing Working Hours String ---
export function parseWorkingHours(workingHoursJson: WorkingHoursJsonb | null): ParsedWorkingHours {
  const parsedHours: ParsedWorkingHours = {};
  if (!workingHoursJson) {
    return parsedHours;
  }

  let hoursData = workingHoursJson;
  if (typeof workingHoursJson === 'string') {
    try {
      hoursData = JSON.parse(workingHoursJson);
    } catch (e) {
      console.error("Error parsing workingHoursJson as string JSON:", e);
      return parsedHours;
    }
  }

  for (const dayKey in hoursData) {
    if (Object.prototype.hasOwnProperty.call(hoursData, dayKey)) {
      const dayIndex = parseInt(dayKey, 10);
      const dayRanges = hoursData[dayKey];

      if (Array.isArray(dayRanges)) {
        parsedHours[dayIndex] = dayRanges.map(range => {
          // --- FIX: Updated guard clause to check for 'start' and 'end' ---
          if (!range || typeof range.start !== 'string' || typeof range.end !== 'string') {
            console.error(`Invalid shift structure for day ${dayKey}. Expected object with 'start' and 'end' properties. Got: `, range);
            return null; // This will be filtered out
          }
          // --- END FIX ---

          const now = new Date();
          
          // --- FIX: Use range.start and range.end ---
          const startTimeStr = range.start;
          const endTimeStr = range.end;
          // --- END FIX ---

          const startHourMin = parse(startTimeStr, 'HH:mm', now, { locale: enUS });
          const endHourMin = parse(endTimeStr, 'HH:mm', now, { locale: enUS });

          if (isValid(startHourMin) && isValid(endHourMin)) {
            return { start: startHourMin, end: endHourMin };
          } else {
            console.error(`Invalid time format in JSONB for day ${dayKey}: ${startTimeStr}-${endTimeStr}. Expected HH:mm.`);
            return null;
          }
        }).filter(Boolean) as DailyWorkingHours[];
      }
    }
  }
  return parsedHours;
}

// --- Part 2: Generating and Filtering Booking Slots ---
/**
 * Generates available booking slots for a given service, provider, and selected date.
 * @param company The company object with working hours.
 * @param service The service object with estimated duration.
 * @param selectedProvider The provider to book with.
 * @param selectedDate The specific date for which to generate slots.
 * @param confirmedBookings Existing confirmed bookings for the provider on this day.
 * @returns An array of available slots.
 */



/**
 * Calculates the estimated start time for a new queue entry,
 * taking into account existing confirmed bookings and other active queue members for a specific provider.
 * @param company The company object.
 * @param service The service for which the queue is joined.
 * @param selectedProvider The provider the queue is for.
 * @param confirmedBookingsForProvider Existing confirmed bookings for the selected provider for today.
 * @param activeQueueEntriesForProvider Existing 'waiting' or 'serving' queue entries for this provider.
 * @returns An estimated Date for when the service might start for the new queue entry.
 */
// lib/booking-utils.ts (inside calculateEstimatedQueueStartTime function)

// export function calculateEstimatedQueueStartTime(
//   company: Company,
//   service: Service,
//   selectedProvider: Provider,
//   confirmedBookingsForProvider: Booking[], // These are for the entire day 'now' is on
//   activeQueueEntriesForProvider: QueueItem[] // These are for the entire day 'now' is on
// ): Date | null {
//   if (!company.working_hours || !service.estimated_wait_time_mins) {
//     return null;
//   }

//   const now = new Date();
//   const serviceDuration = service.estimated_wait_time_mins;
//   const dayOfWeek = getDay(now);
//   const parsedWorkingHours = parseWorkingHours(company.working_hours);
//   const dailyHoursRanges = parsedWorkingHours[dayOfWeek];

//   if (!dailyHoursRanges || dailyHoursRanges.length === 0) {
//     return null; // Company not open today
//   }

//   // --- New Approach: Iterate through potential slots ---

//   let earliestPossibleSlotTime: Date | null = null; // This will store our final best slot
  
//   // Sort all relevant "occupancy" events for today
//   // Combine confirmed bookings and active queue entries into a single timeline of occupied slots.
//   // For simplicity, we'll treat each queue entry as occupying a slot starting 'now' + its cumulative duration.
//   // A more advanced system might track actual serving status (start/end times of queue items).
  
//   // Create a combined list of "busy periods"
//   const busyPeriods: { start: Date; end: Date }[] = [];

//   // Add confirmed bookings as busy periods
//   confirmedBookingsForProvider.forEach(booking => {
//     const bookingStart = new Date(booking.start_time);
//     const bookingEnd = new Date(booking.end_time);
//     // Only consider future bookings for today
//     if (isSameDay(bookingStart, now) && isAfter(bookingEnd, now)) {
//       busyPeriods.push({ start: bookingStart, end: bookingEnd });
//     }
//   });

//   // Add active queue entries as busy periods, estimated sequentially from 'now'
//   // Start from a point 'now' rounded up to the next service interval
//   let currentQueueOccupancyEnd = setMilliseconds(setSeconds(setMinutes(now, now.getMinutes()), 0), 0);
//   const minutesIntoInterval = currentQueueOccupancyEnd.getMinutes() % serviceDuration;
//   if (minutesIntoInterval !== 0) {
//       currentQueueOccupancyEnd = addMinutes(currentQueueOccupancyEnd, serviceDuration - minutesIntoInterval);
//   }

//   activeQueueEntriesForProvider.forEach(() => {
//     const queueEntryStart = new Date(currentQueueOccupancyEnd);
//     currentQueueOccupancyEnd = addMinutes(currentQueueOccupancyEnd, serviceDuration);
//     busyPeriods.push({ start: queueEntryStart, end: currentQueueOccupancyEnd });
//   });

//   // Sort busy periods by their start time
//   busyPeriods.sort((a, b) => a.start.getTime() - b.start.getTime());

//   // Merge overlapping busy periods to simplify
//   const mergedBusyPeriods: { start: Date; end: Date }[] = [];
//   busyPeriods.forEach(period => {
//     // If mergedBusyPeriods is empty, or the current period does not overlap with the last merged period
//     if (mergedBusyPeriods.length === 0 || isAfter(period.start, mergedBusyPeriods[mergedBusyPeriods.length - 1].end)) {
//       // Add the current period as a new, distinct merged period
//       mergedBusyPeriods.push(period);
//     } else {
//       // The current period overlaps or touches the last merged period.
//       // Extend the end time of the last merged period if the current period extends further.
//       const lastMergedPeriod = mergedBusyPeriods[mergedBusyPeriods.length - 1];
      
//       // Update the end time to be the later of the two
//       lastMergedPeriod.end = isAfter(period.end, lastMergedPeriod.end) ? period.end : lastMergedPeriod.end;
      
//       // Also, update the start time to be the earlier of the two (in case a later period started earlier)
//       lastMergedPeriod.start = isBefore(period.start, lastMergedPeriod.start) ? period.start : lastMergedPeriod.start;
//     }
//   });


//   // Iterate through today's working hours to find the first free slot
//   for (const hoursRange of dailyHoursRanges) {
//     let slotCandidateStart = setMilliseconds(setSeconds(setMinutes(setHours(now, hoursRange.start.getHours()), hoursRange.start.getMinutes()), 0), 0);
//     const dayEnd = setMilliseconds(setSeconds(setMinutes(setHours(now, hoursRange.end.getHours()), hoursRange.end.getMinutes()), 0), 0);

//     // If starting a new working range, ensure slotCandidateStart is not before 'now' (if today)
//     if (isBefore(slotCandidateStart, now)) {
//       slotCandidateStart = new Date(now);
//       // Round up from 'now' to the next interval as before
//       const minutesIntoInterval = slotCandidateStart.getMinutes() % serviceDuration;
//       if (minutesIntoInterval !== 0) {
//           slotCandidateStart = addMinutes(slotCandidateStart, serviceDuration - minutesIntoInterval);
//       }
//       slotCandidateStart = setMilliseconds(setSeconds(slotCandidateStart, 0), 0); // Clean seconds/milliseconds
//     }
    
//     // Safety check: if after adjustment, slotCandidateStart is past dayEnd
//     if (isAfter(slotCandidateStart, dayEnd)) {
//         continue; // This working range is already over for today
//     }

//     // Now check for available slots
//     while (addMinutes(slotCandidateStart, serviceDuration) <= dayEnd) {
//       const slotCandidateEnd = addMinutes(slotCandidateStart, serviceDuration);

//       // Check for overlap with any merged busy period
//       const isOccupied = mergedBusyPeriods.some(busy => {
//         return (isBefore(slotCandidateStart, busy.end) && isAfter(slotCandidateEnd, busy.start));
//       });

//       if (!isOccupied) {
//         // Found the first available slot!
//         earliestPossibleSlotTime = slotCandidateStart;
//         break; // Exit while loop
//       }

//       slotCandidateStart = addMinutes(slotCandidateStart, serviceDuration); // Move to next slot
//     }

//     if (earliestPossibleSlotTime) {
//       break; // Exit for loop if a slot was found in this working range
//     }
//   }

//   // Final check: if the earliest possible slot is still in the past, push it to now + duration
//   if (earliestPossibleSlotTime && isBefore(earliestPossibleSlotTime, now)) {
//       earliestPossibleSlotTime = addMinutes(now, serviceDuration);
//       earliestPossibleSlotTime = setMilliseconds(setSeconds(earliestPossibleSlotTime, 0), 0);
//       // And then round up again
//       const minutesIntoInterval = earliestPossibleSlotTime.getMinutes() % serviceDuration;
//       if (minutesIntoInterval !== 0) {
//           earliestPossibleSlotTime = addMinutes(earliestPossibleSlotTime, serviceDuration - minutesIntoInterval);
//       }
//   }

//   return earliestPossibleSlotTime;
// }
   

// lib/booking-utils.ts (inside generateAvailableSlots function)

export function generateAvailableSlots(
  company: Company,
  service: Service,
  selectedProvider: Provider,
  selectedDate: Date,
  occupiedSlots: { start_time: string; end_time: string }[]
): AvailableSlot[] {
  const availableSlots: AvailableSlot[] = [];

  if (!company.working_hours || !service.estimated_wait_time_mins) {
    return [];
  }

  const parsedWorkingHours = parseWorkingHours(company.working_hours);
  const dayOfWeek = getDay(selectedDate);

  const dailyHoursRanges = parsedWorkingHours[dayOfWeek];

  if (!dailyHoursRanges || dailyHoursRanges.length === 0) {
    return []; // Company is not open on this day
  }

  const serviceDuration = service.estimated_wait_time_mins;
  const now = new Date();
  
  const occupiedPeriods = occupiedSlots.map(slot => ({
    start: parseISO(slot.start_time),
    end: parseISO(slot.end_time),
  }));

  dailyHoursRanges.forEach(hoursRange => {
    let currentSlotStart = setMilliseconds(setSeconds(setMinutes(setHours(selectedDate, hoursRange.start.getHours()), hoursRange.start.getMinutes()), 0), 0);
    const dayEnd = setMilliseconds(setSeconds(setMinutes(setHours(selectedDate, hoursRange.end.getHours()), hoursRange.end.getMinutes()), 0), 0);
    
    // Adjust currentSlotStart if it's for today and in the past
    if (isSameDay(selectedDate, now)) {
        if (isBefore(currentSlotStart, now)) {
            let alignedNow = new Date(now);
            const minutesIntoInterval = alignedNow.getMinutes() % serviceDuration;
            if (minutesIntoInterval !== 0) {
                alignedNow = addMinutes(alignedNow, serviceDuration - minutesIntoInterval);
            }
            alignedNow = setMilliseconds(setSeconds(alignedNow, 0), 0);

            currentSlotStart = isAfter(alignedNow, currentSlotStart) ? alignedNow : currentSlotStart;
            
            if (isBefore(currentSlotStart, now)) {
                currentSlotStart = alignedNow;
            }
        }
    }
    
    // Safety check: if after adjustment, currentSlotStart is past dayEnd
    if (isAfter(currentSlotStart, dayEnd)) {
        return;
    }
    
    if (isAfter(hoursRange.start, hoursRange.end)) {
      console.warn("DEBUG: Slots - Working hours range start is after end. Skipping.", hoursRange);
      return;
    }

    let loopCount = 0;
    while (addMinutes(currentSlotStart, serviceDuration) <= dayEnd) {
      loopCount++;
      if (loopCount > 1000) {
        console.error("DEBUG: Slots - Infinite loop detected in slot generation. Breaking.");
        break;
      }

      const currentSlotEnd = addMinutes(currentSlotStart, serviceDuration);

      const isOccupied = occupiedPeriods.some(occupied => {
        const overlap = (isBefore(currentSlotStart, occupied.end) && isAfter(currentSlotEnd, occupied.start));
        return overlap;
      });

      if (!isOccupied) {
        availableSlots.push({
          start: currentSlotStart,
          end: currentSlotEnd,
          isBooked: false,
          formattedTime: format(currentSlotStart, 'h:mm a', { locale: enUS }),
        });
      }

      currentSlotStart = addMinutes(currentSlotStart, serviceDuration);
    }
  });
  return availableSlots;
}

/**
 * Gets a date range (start of day to end of day) for fetching bookings.
 * @param date The date to get the range for.
 * @returns {start: Date, end: Date}
 */
export const getDayRange = (date: Date) => {
  const start = startOfDay(date);
  const end = endOfDay(date);
  return { start, end };
};


export const getCompanyWorkingHoursForDay = (
  company: Company,
  date: Date
): { start: Date; end: Date } | null => {
  if (!company.working_hours) return null;

  const dayOfWeek = getDay(date);
  const parsedWorkingHours = parseWorkingHours(company.working_hours);
  const dailyHoursRanges = parsedWorkingHours[dayOfWeek];

  if (!dailyHoursRanges || dailyHoursRanges.length === 0) {
    return null;
  }

  // If there are multiple ranges, this helper returns the first.
  const firstRange = dailyHoursRanges[0];
  if (firstRange) {
    const start = setMilliseconds(setSeconds(setMinutes(setHours(date, firstRange.start.getHours()), firstRange.start.getMinutes()), 0), 0);
    const end = setMilliseconds(setSeconds(setMinutes(setHours(date, firstRange.end.getHours()), firstRange.end.getMinutes()), 0), 0);
    return { start, end };
  }

  return null;
};