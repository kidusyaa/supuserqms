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
} from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { Company, Service, Booking, QueueItem, ParsedWorkingHours, DailyWorkingHours, AvailableSlot,Provider, WorkingHoursJsonb } from '@/type';

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

  // Supabase PostgREST should return JSONB columns as objects directly.
  // If for some reason it's still a string, try to parse it.
  let hoursData = workingHoursJson;
  if (typeof workingHoursJson === 'string') { // This check is mostly for older data or unexpected API behavior
    try {
      hoursData = JSON.parse(workingHoursJson);
    } catch (e) {
      console.error("Error parsing workingHoursJson as string JSON:", e);
      return parsedHours;
    }
  }

  // Iterate through the days (keys '0' through '6')
  for (const dayKey in hoursData) {
    if (hoursData.hasOwnProperty(dayKey)) {
      const dayIndex = parseInt(dayKey, 10); // Convert '1' to 1 (Monday)
      const dayRanges = hoursData[dayKey]; // This should be an array of {start: "HH:mm", end: "HH:mm"}

      if (Array.isArray(dayRanges)) {
        parsedHours[dayIndex] = dayRanges.map(range => {
          const now = new Date(); // Reference date for parsing time components
          const startTimeStr = range.start; // e.g., "08:00"
          const endTimeStr = range.end;   // e.g., "17:00"

          // Parse using 'HH:mm' format
          const startHourMin = parse(startTimeStr, 'HH:mm', now, { locale: enUS });
          const endHourMin = parse(endTimeStr, 'HH:mm', now, { locale: enUS });

          if (isValid(startHourMin) && isValid(endHourMin)) {
            return { start: startHourMin, end: endHourMin };
          } else {
            console.error(`Invalid time format in JSONB for day ${dayKey}: ${startTimeStr}-${endTimeStr}. Expected HH:mm.`);
            return null;
          }
        }).filter(Boolean) as DailyWorkingHours[]; // Filter out any null entries from parsing failures
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

export function calculateEstimatedQueueStartTime(
  company: Company,
  service: Service,
  selectedProvider: Provider,
  confirmedBookingsForProvider: Booking[], // These are for the entire day 'now' is on
  activeQueueEntriesForProvider: QueueItem[] // These are for the entire day 'now' is on
): Date | null {
  if (!company.working_hours || !service.estimated_wait_time_mins) {
    return null;
  }

  const now = new Date();
  const serviceDuration = service.estimated_wait_time_mins;
  const dayOfWeek = getDay(now);
  const parsedWorkingHours = parseWorkingHours(company.working_hours);
  const dailyHoursRanges = parsedWorkingHours[dayOfWeek];

  if (!dailyHoursRanges || dailyHoursRanges.length === 0) {
    return null; // Company not open today
  }

  // --- New Approach: Iterate through potential slots ---

  let earliestPossibleSlotTime: Date | null = null; // This will store our final best slot
  
  // Sort all relevant "occupancy" events for today
  // Combine confirmed bookings and active queue entries into a single timeline of occupied slots.
  // For simplicity, we'll treat each queue entry as occupying a slot starting 'now' + its cumulative duration.
  // A more advanced system might track actual serving status (start/end times of queue items).
  
  // Create a combined list of "busy periods"
  const busyPeriods: { start: Date; end: Date }[] = [];

  // Add confirmed bookings as busy periods
  confirmedBookingsForProvider.forEach(booking => {
    const bookingStart = new Date(booking.start_time);
    const bookingEnd = new Date(booking.end_time);
    // Only consider future bookings for today
    if (isSameDay(bookingStart, now) && isAfter(bookingEnd, now)) {
      busyPeriods.push({ start: bookingStart, end: bookingEnd });
    }
  });

  // Add active queue entries as busy periods, estimated sequentially from 'now'
  // Start from a point 'now' rounded up to the next service interval
  let currentQueueOccupancyEnd = setMilliseconds(setSeconds(setMinutes(now, now.getMinutes()), 0), 0);
  const minutesIntoInterval = currentQueueOccupancyEnd.getMinutes() % serviceDuration;
  if (minutesIntoInterval !== 0) {
      currentQueueOccupancyEnd = addMinutes(currentQueueOccupancyEnd, serviceDuration - minutesIntoInterval);
  }

  activeQueueEntriesForProvider.forEach(() => {
    const queueEntryStart = new Date(currentQueueOccupancyEnd);
    currentQueueOccupancyEnd = addMinutes(currentQueueOccupancyEnd, serviceDuration);
    busyPeriods.push({ start: queueEntryStart, end: currentQueueOccupancyEnd });
  });

  // Sort busy periods by their start time
  busyPeriods.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Merge overlapping busy periods to simplify
  const mergedBusyPeriods: { start: Date; end: Date }[] = [];
  busyPeriods.forEach(period => {
    // If mergedBusyPeriods is empty, or the current period does not overlap with the last merged period
    if (mergedBusyPeriods.length === 0 || isAfter(period.start, mergedBusyPeriods[mergedBusyPeriods.length - 1].end)) {
      // Add the current period as a new, distinct merged period
      mergedBusyPeriods.push(period);
    } else {
      // The current period overlaps or touches the last merged period.
      // Extend the end time of the last merged period if the current period extends further.
      const lastMergedPeriod = mergedBusyPeriods[mergedBusyPeriods.length - 1];
      
      // Update the end time to be the later of the two
      lastMergedPeriod.end = isAfter(period.end, lastMergedPeriod.end) ? period.end : lastMergedPeriod.end;
      
      // Also, update the start time to be the earlier of the two (in case a later period started earlier)
      lastMergedPeriod.start = isBefore(period.start, lastMergedPeriod.start) ? period.start : lastMergedPeriod.start;
    }
  });


  // Iterate through today's working hours to find the first free slot
  for (const hoursRange of dailyHoursRanges) {
    let slotCandidateStart = setMilliseconds(setSeconds(setMinutes(setHours(now, hoursRange.start.getHours()), hoursRange.start.getMinutes()), 0), 0);
    const dayEnd = setMilliseconds(setSeconds(setMinutes(setHours(now, hoursRange.end.getHours()), hoursRange.end.getMinutes()), 0), 0);

    // If starting a new working range, ensure slotCandidateStart is not before 'now' (if today)
    if (isBefore(slotCandidateStart, now)) {
      slotCandidateStart = new Date(now);
      // Round up from 'now' to the next interval as before
      const minutesIntoInterval = slotCandidateStart.getMinutes() % serviceDuration;
      if (minutesIntoInterval !== 0) {
          slotCandidateStart = addMinutes(slotCandidateStart, serviceDuration - minutesIntoInterval);
      }
      slotCandidateStart = setMilliseconds(setSeconds(slotCandidateStart, 0), 0); // Clean seconds/milliseconds
    }
    
    // Safety check: if after adjustment, slotCandidateStart is past dayEnd
    if (isAfter(slotCandidateStart, dayEnd)) {
        continue; // This working range is already over for today
    }

    // Now check for available slots
    while (addMinutes(slotCandidateStart, serviceDuration) <= dayEnd) {
      const slotCandidateEnd = addMinutes(slotCandidateStart, serviceDuration);

      // Check for overlap with any merged busy period
      const isOccupied = mergedBusyPeriods.some(busy => {
        return (isBefore(slotCandidateStart, busy.end) && isAfter(slotCandidateEnd, busy.start));
      });

      if (!isOccupied) {
        // Found the first available slot!
        earliestPossibleSlotTime = slotCandidateStart;
        break; // Exit while loop
      }

      slotCandidateStart = addMinutes(slotCandidateStart, serviceDuration); // Move to next slot
    }

    if (earliestPossibleSlotTime) {
      break; // Exit for loop if a slot was found in this working range
    }
  }

  // Final check: if the earliest possible slot is still in the past, push it to now + duration
  if (earliestPossibleSlotTime && isBefore(earliestPossibleSlotTime, now)) {
      earliestPossibleSlotTime = addMinutes(now, serviceDuration);
      earliestPossibleSlotTime = setMilliseconds(setSeconds(earliestPossibleSlotTime, 0), 0);
      // And then round up again
      const minutesIntoInterval = earliestPossibleSlotTime.getMinutes() % serviceDuration;
      if (minutesIntoInterval !== 0) {
          earliestPossibleSlotTime = addMinutes(earliestPossibleSlotTime, serviceDuration - minutesIntoInterval);
      }
  }

  return earliestPossibleSlotTime;
}
   

// lib/booking-utils.ts (inside generateAvailableSlots function)

export function generateAvailableSlots(
  company: Company,
  service: Service,
  selectedProvider: Provider,
  selectedDate: Date,
  confirmedBookings: Booking[]
): AvailableSlot[] {
  const availableSlots: AvailableSlot[] = [];

  console.log("--- DEBUG: generateAvailableSlots ---");
  console.log("Input selectedDate:", selectedDate);
  console.log("Input company.working_hours:", company.working_hours);
  console.log("Input service.estimated_wait_time_mins:", service.estimated_wait_time_mins);
  console.log("Input selectedProvider:", selectedProvider);
  console.log("Input confirmedBookings count:", confirmedBookings.length);

  if (!company.working_hours || !service.estimated_wait_time_mins) {
    console.log("DEBUG: Slots - Missing working_hours or estimated_wait_time_mins. Returning [].");
    return [];
  }

  const parsedWorkingHours = parseWorkingHours(company.working_hours);
  const dayOfWeek = getDay(selectedDate); // 0 for Sunday, 1 for Monday, etc.

  const dailyHoursRanges = parsedWorkingHours[dayOfWeek];
  console.log("DEBUG: Slots - Parsed Working Hours for all days:", parsedWorkingHours);
  console.log(`DEBUG: Slots - Daily Hours Ranges for ${format(selectedDate, 'EEEE')} (dayOfWeek ${dayOfWeek}):`, dailyHoursRanges);

  if (!dailyHoursRanges || dailyHoursRanges.length === 0) {
    console.log("DEBUG: Slots - No dailyHoursRanges found for this day. Returning [].");
    return []; // Company is not open on this day
  }

  const serviceDuration = service.estimated_wait_time_mins;
  const now = new Date();
  
  dailyHoursRanges.forEach(hoursRange => {
    console.log(`DEBUG: Slots - Processing hoursRange: ${format(hoursRange.start, 'h:mm a')} - ${format(hoursRange.end, 'h:mm a')}`);

    let currentSlotStart = setMilliseconds(setSeconds(setMinutes(setHours(selectedDate, hoursRange.start.getHours()), hoursRange.start.getMinutes()), 0), 0);
    const dayEnd = setMilliseconds(setSeconds(setMinutes(setHours(selectedDate, hoursRange.end.getHours()), hoursRange.end.getMinutes()), 0), 0);
    
    console.log(`DEBUG: Slots - Initial slotCandidateStart: ${format(currentSlotStart, 'yyyy-MM-dd HH:mm:ss')}`);
    console.log(`DEBUG: Slots - Day End for range: ${format(dayEnd, 'yyyy-MM-dd HH:mm:ss')}`);

    // Adjust currentSlotStart if it's for today and in the past
    if (isSameDay(selectedDate, now) && isBefore(currentSlotStart, now)) {
      console.log("DEBUG: Slots - Adjusting start for today and past time.");
      let latestPossibleStart = new Date(now);
      latestPossibleStart = addMinutes(latestPossibleStart, serviceDuration - (latestPossibleStart.getMinutes() % serviceDuration || serviceDuration));
      
      currentSlotStart = isAfter(latestPossibleStart, currentSlotStart) ? latestPossibleStart : currentSlotStart;
      if (isBefore(currentSlotStart, now)) { // Ensure it's not strictly in the past, even after rounding
        currentSlotStart = now; 
      }
      currentSlotStart = setMilliseconds(setSeconds(currentSlotStart, 0), 0); // Clean seconds/milliseconds
      console.log(`DEBUG: Slots - Adjusted currentSlotStart (today/past): ${format(currentSlotStart, 'yyyy-MM-dd HH:mm:ss')}`);
    }
    
    // Safety check: if after adjustment, currentSlotStart is past dayEnd
    if (isAfter(currentSlotStart, dayEnd)) {
        console.log("DEBUG: Slots - currentSlotStart is after dayEnd after adjustment. Skipping range.");
        return; // This working range is already over for today
    }
    
    // Check if the range itself is valid (e.g., start is before end)
    if (isAfter(hoursRange.start, hoursRange.end)) {
      console.warn("DEBUG: Slots - Working hours range start is after end. Skipping.", hoursRange);
      return;
    }


    let loopCount = 0;
    while (addMinutes(currentSlotStart, serviceDuration) <= dayEnd) {
      loopCount++;
      if (loopCount > 100) { // Safety break for infinite loops
        console.error("DEBUG: Slots - Infinite loop detected in slot generation. Breaking.");
        break;
      }

      const currentSlotEnd = addMinutes(currentSlotStart, serviceDuration);
      console.log(`DEBUG: Slots - Testing slot: ${format(currentSlotStart, 'h:mm a')} - ${format(currentSlotEnd, 'h:mm a')}`);

      // Check for overlap with confirmed bookings for THIS provider
      const isOccupied = confirmedBookings.some(booking => {
        const bookingStart = new Date(booking.start_time);
        const bookingEnd = new Date(booking.end_time);

        // An overlap occurs if (currentSlotStart < bookingEnd && currentSlotEnd > bookingStart)
        const overlap = (isBefore(currentSlotStart, bookingEnd) && isAfter(currentSlotEnd, bookingStart));
        if (overlap) {
          console.log(`DEBUG: Slots - Overlap found with booking: ${format(bookingStart, 'h:mm a')} - ${format(bookingEnd, 'h:mm a')}`);
        }
        return overlap;
      });

      if (!isOccupied) {
        // Ensure the slot isn't entirely in the past IF it's for today.
        // This handles cases where 'now' pushes currentSlotStart forward,
        // but an earlier full slot might still exist in the iteration logic.
        if (isSameDay(selectedDate, now) && isBefore(currentSlotEnd, now)) {
            console.log("DEBUG: Slots - Skipping past slot for today:", format(currentSlotStart, 'h:mm a'));
        } else {
            availableSlots.push({
              start: currentSlotStart,
              end: currentSlotEnd,
              formattedTime: format(currentSlotStart, 'h:mm a', { locale: enUS }),
            });
            console.log(`DEBUG: Slots - Added slot: ${format(currentSlotStart, 'h:mm a')}`);
        }
      }

      currentSlotStart = addMinutes(currentSlotStart, serviceDuration);
    }
    console.log(`DEBUG: Slots - Exited while loop for range. Loop ran ${loopCount} times.`);
  });
  console.log("DEBUG: Slots - Final availableSlots count:", availableSlots.length);
  console.log("--- END DEBUG: generateAvailableSlots ---");
  return availableSlots;
}

/**
 * Gets a date range (start of day to end of day) for fetching bookings.
 * @param date The date to get the range for.
 * @returns {start: Date, end: Date}
 */
export function getDayRange(date: Date): { start: Date; end: Date } {
  const start = startOfDay(date);
  const end = endOfDay(date);
  return { start, end };
}