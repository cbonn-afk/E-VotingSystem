import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { rangeValueForPreset } from "@/utils/dateRange";

import PeriodRangeFilter from "./PeriodRangeFilter";

describe("PeriodRangeFilter month navigation", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("moves to the previous month and disables future navigation", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 29, 12));
    const onChange = vi.fn();

    render(
      <PeriodRangeFilter
        value={rangeValueForPreset("this_month")}
        onChange={onChange}
        enableMonthNavigation
      />,
    );

    expect(screen.getByText("July 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));

    expect(onChange).toHaveBeenCalledWith({
      preset: "last_month",
      from: "2026-06-01",
      to: "2026-06-30",
    });
  });

  it("supports left and right keyboard navigation", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 29, 12));
    const onChange = vi.fn();

    render(
      <PeriodRangeFilter
        value={{
          preset: "last_month",
          from: "2026-06-01",
          to: "2026-06-30",
        }}
        onChange={onChange}
        enableMonthNavigation
      />,
    );

    fireEvent.keyDown(screen.getByLabelText(/Selected month June 2026/), {
      key: "ArrowRight",
    });

    expect(onChange).toHaveBeenCalledWith({
      preset: "this_month",
      from: "2026-07-01",
      to: "2026-07-29",
    });
  });
});
