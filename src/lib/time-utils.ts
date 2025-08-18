// In /lib/time-utils.ts

/**
 * Parses a single time string like "8am" or "5:30pm" into a 24-hour format object.
 * This function is reliable for individual time strings.
 * @param timeStr The time string (e.g., "8am", "5:30pm").
 * @returns An object with hour and minute, or null if invalid.
 */
const parseTime = (timeStr: string): { hour: number; minute: number } | null => {
  const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
  if (!match) return null;

  let [, hourStr, minuteStr, period] = match;
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr ? parseInt(minuteStr, 10) : 0;

  if (period.toLowerCase() === 'pm' && hour < 12) {
    hour += 12;
  }
  if (period.toLowerCase() === 'am' && hour === 12) {
    hour = 0; // Midnight case
  }

  return { hour, minute };
};

/**
 * Generates available time slots based on company working hours and service duration.
 * This function is robust and can handle messy working hour strings.
 * @param workingHoursStr The string from the company document, e.g., " - , Mon - Sat (8am - 5pm)".
 * @param serviceDuration The duration of the service in minutes.
 * @returns An array of formatted time slots (e.g., ["08:00 AM", "08:30 AM"]).
 */
export const generateTimeSlots = (workingHoursStr: string | undefined, serviceDuration: number): string[] => {
  if (!workingHoursStr || !serviceDuration || serviceDuration <= 0) {
    return [];
  }

  // --- THIS IS THE FIX ---
  // A much simpler and more robust regex to find time strings.
  // It looks for a number, an optional colon + minutes part, and then am/pm.
  const timeMatches = workingHoursStr.match(/\d{1,2}(:\d{2})?\s*(am|pm)/gi);

  if (!timeMatches || timeMatches.length < 2) {
    // This console.error will now only trigger if there are genuinely no times in the string.
    console.error(`Could not parse working hours string: ${workingHoursStr}`);
    return [];
  }

  // Assume the first found time is the start and the last is the end.
  const startTime = parseTime(timeMatches[0]);
  const endTime = parseTime(timeMatches[timeMatches.length - 1]);

  if (!startTime || !endTime) {
    return [];
  }

  const slots: string[] = [];
  const now = new Date();
  
  const currentTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startTime.hour, startTime.minute);
  const closingTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endTime.hour, endTime.minute);

  while (currentTime < closingTime) {
    // Check that the appointment can FINISH before or exactly at closing time.
    const appointmentEndTime = new Date(currentTime.getTime() + serviceDuration * 60000);

    if (appointmentEndTime <= closingTime) {
      const formattedTime = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      slots.push(formattedTime);
    }
    
    // Increment by the duration of the service to find the next available slot.
    // NOTE: This assumes back-to-back booking. For more complex scenarios
    // with breaks, a different increment (e.g., 15 minutes) might be needed.
    currentTime.setMinutes(currentTime.getMinutes() + serviceDuration);
  }

  return slots;
};