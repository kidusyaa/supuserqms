// File: src/lib/time-utils.ts

/**
 * Converts a time string "HH:mm" to the total number of minutes from midnight.
 * @param timeStr - The time string (e.g., "09:30").
 * @returns The total minutes from midnight (e.g., 570).
 */
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converts total minutes from midnight back to a "HH:mm" time string.
 * @param totalMinutes - The total minutes from midnight.
 * @returns The formatted time string (e.g., "09:30").
 */
function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Generates an array of time slots based on company working hours and service duration.
 * @param workingHoursString - The raw string from Firestore (e.g., "09:00 - 17:00, Monday - Friday").
 * @param slotDurationMinutes - The duration of the service in minutes (e.g., 40).
 * @returns An array of time slot strings (e.g., ["09:00", "09:40", "10:20", ...]).
 */
export function generateTimeSlots(
  workingHoursString: string | undefined | null,
  slotDurationMinutes: number
): string[] {
  if (!workingHoursString || !slotDurationMinutes) {
    return []; // Return empty if data is missing
  }

  // Use a regular expression to safely extract the start and end times
  const timeRegex = /(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/;
  const match = workingHoursString.match(timeRegex);

  if (!match) {
    console.error("Could not parse working hours string:", workingHoursString);
    return []; // Return empty if the format is wrong
  }

  const [, startTimeStr, endTimeStr] = match;

  const startMinutes = timeToMinutes(startTimeStr);
  const endMinutes = timeToMinutes(endTimeStr);
  
  const slots: string[] = [];
  let currentMinutes = startMinutes;

  while (currentMinutes + slotDurationMinutes <= endMinutes) {
    slots.push(minutesToTime(currentMinutes));
    currentMinutes += slotDurationMinutes;
  }

  return slots;
}