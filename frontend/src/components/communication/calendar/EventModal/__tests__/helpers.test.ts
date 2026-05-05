import { describe, it, expect } from "vitest";
import {
  getDefaultTimes,
  parseDateOnly,
  parseFormDate,
  toApiDateTime,
  toInputValue,
} from "../helpers";

describe("toInputValue", () => {
  it("formats an ISO datetime as datetime-local when not all-day", () => {
    expect(toInputValue("2026-05-03T14:30:00.000Z", false)).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
    );
  });

  it("formats an ISO datetime as a date-only string when all-day", () => {
    expect(toInputValue("2026-05-03T00:00:00.000-03:00", true)).toBe("2026-05-03");
  });
});

describe("parseDateOnly", () => {
  it("returns local midnight for the given calendar date", () => {
    const d = parseDateOnly("2026-05-03");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(3);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it("returns local 23:59:59.999 when endOfDay is true", () => {
    const d = parseDateOnly("2026-05-03", true);
    expect(d.getHours()).toBe(23);
    expect(d.getMinutes()).toBe(59);
    expect(d.getSeconds()).toBe(59);
    expect(d.getMilliseconds()).toBe(999);
  });
});

describe("parseFormDate", () => {
  it("treats date-only strings as local midnight when isAllDay", () => {
    const d = parseFormDate("2026-05-03", true);
    expect(d.getHours()).toBe(0);
  });

  it("treats date-only strings as end-of-day when isAllDay + endOfDay", () => {
    const d = parseFormDate("2026-05-03", true, true);
    expect(d.getHours()).toBe(23);
  });

  it("falls back to native Date parsing when not all-day", () => {
    const d = parseFormDate("2026-05-03T10:00:00", false);
    expect(d.getHours()).toBe(10);
  });

  it("falls back to native Date parsing when isAllDay but value has time", () => {
    const d = parseFormDate("2026-05-03T15:00:00", true);
    expect(d.getHours()).toBe(15);
  });
});

describe("toApiDateTime", () => {
  it("returns an ISO string for an all-day local midnight", () => {
    const iso = toApiDateTime("2026-05-03", true);
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(new Date(iso).getDate()).toBe(parseDateOnly("2026-05-03").getUTCDate());
  });

  it("returns an ISO string for an end-of-day all-day value", () => {
    const start = new Date(toApiDateTime("2026-05-03", true)).getTime();
    const end = new Date(toApiDateTime("2026-05-03", true, true)).getTime();
    expect(end).toBeGreaterThan(start);
  });
});

describe("getDefaultTimes", () => {
  it("starts on the next round hour and ends one hour later", () => {
    const base = new Date(2026, 4, 3, 10, 17);
    const { startTime, endTime } = getDefaultTimes(base);
    expect(startTime).toBe("2026-05-03T11:00");
    expect(endTime).toBe("2026-05-03T12:00");
  });

  it("rolls over to the next day when called near midnight", () => {
    const base = new Date(2026, 4, 3, 23, 30);
    const { startTime } = getDefaultTimes(base);
    expect(startTime.startsWith("2026-05-04")).toBe(true);
  });

  it("falls back to the current clock when no base date is provided", () => {
    const { startTime, endTime } = getDefaultTimes();
    expect(startTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(endTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});
