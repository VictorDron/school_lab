import { format, parseISO } from "date-fns";
import { DATE_ONLY_PATTERN } from "./constants";

/** Format an ISO datetime string for an HTML date or datetime-local input. */
export function toInputValue(isoString: string, isAllDay: boolean): string {
  return format(
    parseISO(isoString),
    isAllDay ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH:mm",
  );
}

/** Build a Date from a YYYY-MM-DD string in the local timezone, optionally at end of day. */
export function parseDateOnly(value: string, endOfDay = false): Date {
  const [year, month, day] = value.split("-").map(Number);
  return endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Parse a value from either an all-day date input or a datetime-local
 * input. All-day strings are treated as local midnight (or 23:59:59) so
 * they don't shift across timezones.
 */
export function parseFormDate(
  value: string,
  isAllDay: boolean,
  endOfDay = false,
): Date {
  if (isAllDay && DATE_ONLY_PATTERN.test(value)) {
    return parseDateOnly(value, endOfDay);
  }
  return new Date(value);
}

export function toApiDateTime(
  value: string,
  isAllDay: boolean,
  endOfDay = false,
): string {
  return parseFormDate(value, isAllDay, endOfDay).toISOString();
}

/**
 * Compute the suggested start/end datetime-local pair for a brand-new
 * event: start at the next round hour after `defaultDate` (or now), end
 * one hour later.
 */
export function getDefaultTimes(defaultDate?: Date): {
  startTime: string;
  endTime: string;
} {
  const base = defaultDate || new Date();
  const start = new Date(base);
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  return {
    startTime: format(start, "yyyy-MM-dd'T'HH:mm"),
    endTime: format(end, "yyyy-MM-dd'T'HH:mm"),
  };
}
