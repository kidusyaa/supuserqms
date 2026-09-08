import { toEthiopian, toGregorian } from "ethiopian-date";
import { format as formatGregorian, isValid } from "date-fns";

export const ETHIOPIAN_MONTHS_AMHARIC = [
  "መስከረም",
  "ጥቅምት",
  "ኅዳር",
  "ታኅሣሥ",
  "ጥር",
  "የካቲት",
  "መጋቢት",
  "ሚያዝያ",
  "ግንቦት",
  "ሰኔ",
  "ሐምሌ",
  "ነሐሴ",
  "ጳጉሜ",
] as const;

export const ETHIOPIAN_MONTHS_ENGLISH = [
  "Meskerem",
  "Tikimt",
  "Hidar",
  "Tahsas",
  "Tir",
  "Yakatit",
  "Megabit",
  "Miazia",
  "Ginbot",
  "Sene",
  "Hamle",
  "Nehase",
  "Pagume",
] as const;

export const ETHIOPIAN_WEEKDAYS_AMHARIC = [
  "እሑድ",
  "ሰኞ",
  "ማክሰኞ",
  "ረቡዕ",
  "ሐሙስ",
  "ዓርብ",
  "ቅዳሜ",
] as const;

export const ETHIOPIAN_WEEKDAYS_SHORT_AMHARIC = [
  "እሑ",
  "ሰኞ",
  "ማክ",
  "ረቡ",
  "ሐሙ",
  "ዓር",
  "ቅዳ",
] as const;

export interface EthiopianDateObject {
  year: number;
  month: number; // 1 to 13
  day: number; // 1 to 30 (or 1-6 for Pagume)
  monthNameAm: string;
  monthNameEn: string;
  weekdayAm: string;
  weekdayIndex: number; // 0 = Sunday, 1 = Monday, ...
}

/**
 * Converts a JavaScript Date or ISO string to an Ethiopian date object.
 */
export function getEthiopianDate(dateInput: Date | string | number): EthiopianDateObject {
  const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  
  if (!isValid(date)) {
    const now = new Date();
    const [year, month, day] = toEthiopian(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const monthIdx = Math.max(0, Math.min(12, month - 1));
    const dayOfWeek = now.getDay();
    return {
      year,
      month,
      day,
      monthNameAm: ETHIOPIAN_MONTHS_AMHARIC[monthIdx],
      monthNameEn: ETHIOPIAN_MONTHS_ENGLISH[monthIdx],
      weekdayAm: ETHIOPIAN_WEEKDAYS_AMHARIC[dayOfWeek],
      weekdayIndex: dayOfWeek,
    };
  }

  const gYear = date.getFullYear();
  const gMonth = date.getMonth() + 1;
  const gDay = date.getDate();

  const [ethYear, ethMonth, ethDay] = toEthiopian(gYear, gMonth, gDay);
  const monthIdx = Math.max(0, Math.min(12, ethMonth - 1));
  const dayOfWeek = date.getDay();

  return {
    year: ethYear,
    month: ethMonth,
    day: ethDay,
    monthNameAm: ETHIOPIAN_MONTHS_AMHARIC[monthIdx] || `ወር ${ethMonth}`,
    monthNameEn: ETHIOPIAN_MONTHS_ENGLISH[monthIdx] || `Month ${ethMonth}`,
    weekdayAm: ETHIOPIAN_WEEKDAYS_AMHARIC[dayOfWeek],
    weekdayIndex: dayOfWeek,
  };
}

/**
 * Converts an Ethiopian date (Year, Month 1-13, Day 1-30) to a JavaScript Gregorian Date.
 */
export function ethiopianToGregorianDate(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0
): Date {
  const [gYear, gMonth, gDay] = toGregorian(year, month, day);
  return new Date(gYear, gMonth - 1, gDay, hours, minutes, seconds);
}

/**
 * Formats a Date object into a readable Ethiopian date string.
 * e.g., "መስከረም 1, 2018 ዓ.ም" or "Meskerem 1, 2018"
 */
export function formatEthiopian(
  dateInput: Date | string | number | null | undefined,
  options?: {
    locale?: "am" | "en";
    includeWeekday?: boolean;
    includeYear?: boolean;
    includeEra?: boolean;
    includeTime?: boolean;
  }
): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  if (!isValid(date)) return "";

  const eth = getEthiopianDate(date);
  const locale = options?.locale || "am";
  const includeWeekday = options?.includeWeekday ?? false;
  const includeYear = options?.includeYear ?? true;
  const includeEra = options?.includeEra ?? (locale === "am");
  const includeTime = options?.includeTime ?? false;

  const monthName = locale === "am" ? eth.monthNameAm : eth.monthNameEn;
  const era = includeEra ? (locale === "am" ? " ዓ.ም" : " E.C.") : "";

  let result = "";
  if (includeWeekday) {
    result += `${eth.weekdayAm}፣ `;
  }

  result += `${monthName} ${eth.day}`;

  if (includeYear) {
    result += `, ${eth.year}${era}`;
  }

  if (includeTime) {
    const timeStr = formatGregorian(date, "h:mm a");
    result += ` (${timeStr})`;
  }

  return result;
}

/**
 * Formats date into dual calendar format, e.g.:
 * "መስከረም 1, 2018 ዓ.ም (Sep 11, 2025)"
 */
export function formatDualDate(
  dateInput: Date | string | number | null | undefined,
  options?: { includeTime?: boolean }
): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  if (!isValid(date)) return "";

  const ethStr = formatEthiopian(date, { locale: "am", includeEra: true });
  const gregStr = formatGregorian(date, options?.includeTime ? "MMM d, yyyy h:mm a" : "MMM d, yyyy");

  return `${ethStr} · ${gregStr}`;
}

/**
 * Returns the number of days in an Ethiopian month for a given Ethiopian year.
 * Months 1-12 always have 30 days.
 * Month 13 (Pagume) has 5 days, or 6 days in a leap year (when year % 4 === 3).
 */
export function getDaysInEthiopianMonth(year: number, month: number): number {
  if (month >= 1 && month <= 12) {
    return 30;
  }
  if (month === 13) {
    return year % 4 === 3 ? 6 : 5;
  }
  return 30;
}

/**
 * Parses an Ethiopian date representation (or object) and returns a standard UTC ISO 8601 string for DB/API storage.
 */
export function parseEthiopianToISO(
  year: number,
  month: number,
  day: number,
  timeStr?: string // e.g. "09:30" or "14:00"
): string {
  let hours = 0;
  let minutes = 0;
  if (timeStr) {
    const parts = timeStr.split(":");
    if (parts.length >= 2) {
      hours = parseInt(parts[0], 10) || 0;
      minutes = parseInt(parts[1], 10) || 0;
    }
  }
  const date = ethiopianToGregorianDate(year, month, day, hours, minutes, 0);
  return date.toISOString();
}

/**
 * Converts a database / API ISO timestamp (TIMESTAMPTZ) to an Ethiopian display-ready object.
 */
export function timestampToEthiopianDisplay(isoTimestamp: string | Date): {
  ethiopianDateFormatted: string;
  ethiopianDateWithWeekday: string;
  dualDateFormatted: string;
  timeFormatted: string;
  ethiopian: EthiopianDateObject;
} {
  const date = typeof isoTimestamp === "string" ? new Date(isoTimestamp) : isoTimestamp;
  return {
    ethiopianDateFormatted: formatEthiopian(date, { locale: "am" }),
    ethiopianDateWithWeekday: formatEthiopian(date, { locale: "am", includeWeekday: true }),
    dualDateFormatted: formatDualDate(date, { includeTime: true }),
    timeFormatted: isValid(date) ? formatGregorian(date, "h:mm a") : "",
    ethiopian: getEthiopianDate(date),
  };
}

