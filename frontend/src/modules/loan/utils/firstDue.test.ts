import { describe, expect, it } from "vitest";

import { firstDueProblem, isSemiMonthlyDate, suggestFirstDue } from "./firstDue";

describe("first due date", () => {
  it("suggests one period after release, like the server", () => {
    expect(suggestFirstDue("monthly", new Date(2026, 0, 31))).toBe("2026-02-28");
    expect(suggestFirstDue("monthly", new Date(2026, 10, 15))).toBe("2026-12-15");
    expect(suggestFirstDue("weekly", new Date(2026, 10, 10))).toBe("2026-11-17");
    expect(suggestFirstDue("semi_monthly", new Date(2026, 10, 10))).toBe("2026-11-30");
  });

  it("knows the 15th and the last day of the month", () => {
    expect(isSemiMonthlyDate("2026-11-15")).toBe(true);
    expect(isSemiMonthlyDate("2026-02-28")).toBe(true);
    expect(isSemiMonthlyDate("2026-11-10")).toBe(false);
  });

  it("explains why a date cannot be used", () => {
    const today = new Date(2026, 10, 10);

    expect(firstDueProblem("", "monthly", today)).toBe("Choose a date.");
    expect(firstDueProblem("2026-11-10", "monthly", today)).toMatch(/future/);
    expect(firstDueProblem("2026-12-10", "semi_monthly", today)).toMatch(/15th/);
    expect(firstDueProblem("2026-12-15", "semi_monthly", today)).toBeNull();
    expect(firstDueProblem("2026-12-10", "monthly", today)).toBeNull();
  });
});
