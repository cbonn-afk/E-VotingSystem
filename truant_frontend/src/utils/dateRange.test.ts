import { describe, expect, it } from "vitest";

import {
  canNavigateToNextMonth,
  getPresetRange,
  isCalendarMonthRange,
  isValidRange,
  rangeValueForPreset,
  shiftCalendarMonth,
} from "./dateRange";

// Fixed reference: Wednesday, 24 June 2026 (month index 5, Q2).
const reference = new Date(2026, 5, 24);

describe("getPresetRange", () => {
  it("resolves calendar presets relative to the reference date", () => {
    expect(getPresetRange("this_month", reference)).toEqual({
      from: "2026-06-01",
      to: "2026-06-24",
    });
    expect(getPresetRange("last_month", reference)).toEqual({
      from: "2026-05-01",
      to: "2026-05-31",
    });
    expect(getPresetRange("this_quarter", reference)).toEqual({
      from: "2026-04-01",
      to: "2026-06-24",
    });
    expect(getPresetRange("this_year", reference)).toEqual({
      from: "2026-01-01",
      to: "2026-06-24",
    });
  });

  it("resolves rolling-window presets", () => {
    expect(getPresetRange("last_30_days", reference)).toEqual({
      from: "2026-05-26",
      to: "2026-06-24",
    });
    expect(getPresetRange("last_12_months", reference)).toEqual({
      from: "2025-06-24",
      to: "2026-06-24",
    });
  });

  it("returns a wide range for All Time and the fallback for Custom", () => {
    expect(getPresetRange("all", reference)).toEqual({
      from: "1970-01-01",
      to: "9999-12-31",
    });

    const fallback = { from: "2024-01-01", to: "2024-03-31" };

    expect(getPresetRange("custom", reference, fallback)).toEqual(fallback);
  });
});

describe("rangeValueForPreset", () => {
  it("includes the preset alongside its resolved range", () => {
    expect(rangeValueForPreset("this_year", reference)).toEqual({
      preset: "this_year",
      from: "2026-01-01",
      to: "2026-06-24",
    });
  });
});

describe("isValidRange", () => {
  it("accepts ordered ranges and rejects reversed or empty ones", () => {
    expect(isValidRange({ from: "2026-01-01", to: "2026-06-24" })).toBe(true);
    expect(isValidRange({ from: "2026-06-24", to: "2026-01-01" })).toBe(false);
    expect(isValidRange({ from: "", to: "2026-06-24" })).toBe(false);
  });
});

describe("calendar month navigation", () => {
  it("moves across month and year boundaries with complete historical months", () => {
    expect(
      shiftCalendarMonth(
        { from: "2026-01-01", to: "2026-01-31" },
        -1,
        reference,
      ),
    ).toEqual({
      preset: "custom",
      from: "2025-12-01",
      to: "2025-12-31",
    });

    expect(
      shiftCalendarMonth(
        { from: "2026-05-01", to: "2026-05-31" },
        1,
        reference,
      ),
    ).toEqual({
      preset: "this_month",
      from: "2026-06-01",
      to: "2026-06-24",
    });
  });

  it("recognizes month ranges and prevents forward navigation past today", () => {
    const current = { from: "2026-06-01", to: "2026-06-24" };
    const previous = { from: "2026-05-01", to: "2026-05-31" };

    expect(isCalendarMonthRange(current, reference)).toBe(true);
    expect(isCalendarMonthRange(previous, reference)).toBe(true);
    expect(
      isCalendarMonthRange({ from: "2026-05-03", to: "2026-05-31" }, reference),
    ).toBe(false);
    expect(canNavigateToNextMonth(current, reference)).toBe(false);
    expect(canNavigateToNextMonth(previous, reference)).toBe(true);
  });
});
