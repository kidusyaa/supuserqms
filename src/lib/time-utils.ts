// src/lib/time-utils.ts

export const generateTimeSlots = (
  workingHoursString: string | null | undefined,
  serviceDurationMins: number | null | undefined,
  intervalMins: number = 15 // Interval for time slots, e.g., 15 minutes
): string[] => {
  const timeSlots: string[] = [];

  const effectiveWorkingHours = workingHoursString || "09:00-17:00"; // Default
  const effectiveServiceDuration = serviceDurationMins && serviceDurationMins > 0 ? serviceDurationMins : 15; // Default

  const [openTimeStr, closeTimeStr] = effectiveWorkingHours.split('-');
  
  if (!openTimeStr || !closeTimeStr) {
      console.error("Invalid working hours format:", effectiveWorkingHours);
      return [];
  }

  const parseTime = (timeStr: string): Date | null => {
    try {
      const now = new Date(); // Use a fixed date to correctly compare times
      const [hours, minutes] = timeStr.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        throw new Error("Invalid time format");
      }
      now.setHours(hours, minutes, 0, 0);
      return now;
    } catch (e) {
      console.error("Error parsing time string:", timeStr, e);
      return null;
    }
  };

  const openTime = parseTime(openTimeStr);
  const closeTime = parseTime(closeTimeStr);

  if (!openTime || !closeTime) {
      return [];
  }

  let currentTime = new Date(openTime.getTime());

  while (currentTime.getTime() + effectiveServiceDuration * 60 * 1000 <= closeTime.getTime()) {
    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    timeSlots.push(`${hours}:${minutes}`);
    
    currentTime.setMinutes(currentTime.getMinutes() + intervalMins); 
  }

  return timeSlots;
};