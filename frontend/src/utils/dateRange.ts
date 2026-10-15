/**
 * Shared date-range presets used by period filters across modules (accounting
 * reports, general ledger, ordering billing statements). Pure + framework-free
 * so it can be unit-tested and reused anywhere. All dates are `yyyy-mm-dd`
 * strings (the Laravel payload format), which also sort/compare lexically.
 */

export type DateRangePreset =
  | "all"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "this_year"
  | "last_12_months"
  | "last_30_days"
  | "custom";

export type DateRange = { from: string; to: string };

export type DateRangeValue = DateRange & {
  preset: DateRangePreset;
};

export const DATE_RANGE_PRESET_LABELS: Record<DateRangePreset, string> = {
  all: "All Time",
  this_month: "This Month",
  last_month: "Last Month",
  this_quarter: "This Quarter",
  this_year: "This Year",
  last_12_months: "Last 12 Months",
  last_30_days: "Last 30 Days",
  custom: "Custom Range",
};

/** Default option list (range-style screens that always need a real range). */
export const DEFAULT_DATE_RANGE_PRESETS: DateRangePreset[] = [
  "this_month",
  "last_month",
  "this_quarter",
  "this_year",
  "last_12_months",
  "last_30_days",
  "custom",
];

// Wide sentinel range so the "All Time" option matches every record.
const ALL_TIME_RANGE: DateRange = { from: "1970-01-01", to: "9999-12-31" };

const toISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const fromISO = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return null;

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );

  return toISO(date) === value ? date : null;
};

const startOfDay = (reference: Date): Date =>
  new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());

const startOfMonth = (reference: Date): Date =>
  new Date(reference.getFullYear(), reference.getMonth(), 1);

const endOfMonth = (reference: Date): Date =>
  new Date(reference.getFullYear(), reference.getMonth() + 1, 0);

/**
 * Resolves a preset into a concrete `{ from, to }` range. Current periods are
 * capped at `reference` (today) so reports never query into the future.
 * `custom` returns `fallback` unchanged — the caller owns custom dates.
 */
export const getPresetRange = (
  preset: DateRangePreset,
  reference: Date = new Date(),
  fallback?: DateRange,
): DateRange => {
  const today = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
  );
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  switch (preset) {
    case "all":
      return { ...ALL_TIME_RANGE };
    case "this_month":
      return { from: toISO(new Date(year, month, 1)), to: toISO(today) };
    case "last_month":
      return {
        from: toISO(new Date(year, month - 1, 1)),
        to: toISO(new Date(year, month, 0)),
      };
    case "this_quarter": {
      const quarterStartMonth = Math.floor(month / 3) * 3;

      return {
        from: toISO(new Date(year, quarterStartMonth, 1)),
        to: toISO(today),
      };
    }
    case "this_year":
      return { from: toISO(new Date(year, 0, 1)), to: toISO(today) };
    case "last_12_months":
      return { from: toISO(new Date(year - 1, month, day)), to: toISO(today) };
    case "last_30_days":
      return { from: toISO(new Date(year, month, day - 29)), to: toISO(today) };
    case "custom":
    default:
      return (
        fallback ?? { from: toISO(new Date(year, month, 1)), to: toISO(today) }
      );
  }
};

/** Builds a full `DateRangeValue` (preset + resolved range) for a preset. */
export const rangeValueForPreset = (
  preset: DateRangePreset,
  reference: Date = new Date(),
): DateRangeValue => ({ preset, ...getPresetRange(preset, reference) });

/**
 * Whether a range represents one reporting month. The current month is
 * month-to-date; historical months must include their complete final day.
 */
export const isCalendarMonthRange = (
  range: DateRange,
  reference: Date = new Date(),
): boolean => {
  const from = fromISO(range.from);
  const to = fromISO(range.to);

  if (
    !from ||
    !to ||
    from.getDate() !== 1 ||
    from.getFullYear() !== to.getFullYear() ||
    from.getMonth() !== to.getMonth()
  ) {
    return false;
  }

  const today = startOfDay(reference);
  const selectedMonth = startOfMonth(from);
  const currentMonth = startOfMonth(today);
  const expectedTo =
    selectedMonth.getTime() === currentMonth.getTime()
      ? today
      : endOfMonth(from);

  return range.to === toISO(expectedTo);
};

export const canNavigateToNextMonth = (
  range: DateRange,
  reference: Date = new Date(),
): boolean => {
  const from = fromISO(range.from);

  return Boolean(
    from && startOfMonth(from).getTime() < startOfMonth(reference).getTime(),
  );
};

/** Moves a monthly range while preventing report navigation into the future. */
export const shiftCalendarMonth = (
  range: DateRange,
  offset: -1 | 1,
  reference: Date = new Date(),
): DateRangeValue => {
  const source = fromISO(range.from) ?? startOfMonth(reference);
  const today = startOfDay(reference);
  const currentMonth = startOfMonth(today);
  let target = new Date(source.getFullYear(), source.getMonth() + offset, 1);

  if (target.getTime() > currentMonth.getTime()) target = currentMonth;

  const isCurrentMonth = target.getTime() === currentMonth.getTime();
  const previousMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() - 1,
    1,
  );
  const preset: DateRangePreset = isCurrentMonth
    ? "this_month"
    : target.getTime() === previousMonth.getTime()
      ? "last_month"
      : "custom";

  return {
    preset,
    from: toISO(target),
    to: toISO(isCurrentMonth ? today : endOfMonth(target)),
  };
};

/** True when both bounds are present and `from <= to` (lexical = chronological). */
export const isValidRange = (range: DateRange): boolean =>
  Boolean(range.from) && Boolean(range.to) && range.from <= range.to;
