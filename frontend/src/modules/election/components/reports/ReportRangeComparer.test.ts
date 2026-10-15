import { describe, expect, it } from "vitest";

import { comparisonRangeFor } from "./ReportRangeComparer";

describe("comparisonRangeFor", () => {
  it("builds the immediately preceding range with the same inclusive length", () => {
    expect(
      comparisonRangeFor(
        { from: "2026-07-01", to: "2026-07-08" },
        "previous_period",
      ),
    ).toEqual({ from: "2026-06-23", to: "2026-06-30" });
  });

  it("builds the equivalent prior-year range and handles leap day", () => {
    expect(
      comparisonRangeFor(
        { from: "2024-02-01", to: "2024-02-29" },
        "prior_year",
      ),
    ).toEqual({ from: "2023-02-01", to: "2023-02-28" });
  });
});
