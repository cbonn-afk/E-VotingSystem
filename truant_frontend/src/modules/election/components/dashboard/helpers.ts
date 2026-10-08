import type { ApexOptions } from "apexcharts";
import type { Theme } from "@mui/material/styles";

import type { JournalEntryResource } from "../../api/types";

// ─── Month bucket helpers ────────────────────────────────────────────────────

export type MonthBucket = {
  key: string; // YYYY-MM
  label: string;
  start: Date;
  end: Date;
};

/** The last {@link count} months, ending with the current month. */
export const lastMonthsBuckets = (
  count = 6,
  reference: Date = new Date(),
): MonthBucket[] => {
  const buckets: MonthBucket[] = [];
  const year = reference.getFullYear();
  const month = reference.getMonth();

  for (let offset = count - 1; offset >= 0; offset--) {
    const start = new Date(year, month - offset, 1);
    const end = new Date(year, month - offset + 1, 1);
    const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;

    buckets.push({
      key,
      label: start.toLocaleString(undefined, { month: "short" }),
      start,
      end,
    });
  }

  return buckets;
};

const parseDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const findBucketIndex = (buckets: MonthBucket[], date: Date): number => {
  for (let i = 0; i < buckets.length; i++) {
    if (date >= buckets[i].start && date < buckets[i].end) return i;
  }

  return -1;
};

// ─── Journal entry aggregations ──────────────────────────────────────────────

export type JournalMonthlyBuckets = {
  labels: string[];
  postedAmount: number[];
  draftAmount: number[];
  postedCount: number[];
  draftCount: number[];
  reversedCount: number[];
};

export const aggregateJournalBuckets = (
  entries: JournalEntryResource[],
  buckets: MonthBucket[],
): JournalMonthlyBuckets => {
  const postedAmount = new Array<number>(buckets.length).fill(0);
  const draftAmount = new Array<number>(buckets.length).fill(0);
  const postedCount = new Array<number>(buckets.length).fill(0);
  const draftCount = new Array<number>(buckets.length).fill(0);
  const reversedCount = new Array<number>(buckets.length).fill(0);

  for (const entry of entries) {
    const reference = parseDate(entry.entryDate);

    if (!reference) continue;

    const index = findBucketIndex(buckets, reference);

    if (index === -1) continue;

    switch (entry.status) {
      case "posted":
        postedAmount[index] += entry.totalDebit;
        postedCount[index] += 1;
        break;
      case "draft":
        draftAmount[index] += entry.totalDebit;
        draftCount[index] += 1;
        break;
      case "reversed":
        reversedCount[index] += 1;
        break;
      default:
        break;
    }
  }

  return {
    labels: buckets.map((bucket) => bucket.label),
    postedAmount,
    draftAmount,
    postedCount,
    draftCount,
    reversedCount,
  };
};

// ─── Formatters ──────────────────────────────────────────────────────────────

export const formatCompactPeso = (value: number): string => {
  const abs = Math.abs(value);

  if (abs >= 1_000_000) return `₱${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `₱${Math.round(value / 1_000)}k`;

  return `₱${value.toFixed(0)}`;
};

// ─── Chart options ───────────────────────────────────────────────────────────

const DISABLED_TEXT = "var(--mui-palette-text-disabled)";

type AreaContext = {
  theme: Theme;
  categories: string[];
};

/** Posted vs draft posting value over the period (area, success/warning). */
export const buildPostingActivityOptions = ({
  theme,
  categories,
}: AreaContext): ApexOptions => ({
  chart: { parentHeightOffset: 0, toolbar: { show: false } },
  stroke: { width: [4, 4], curve: "smooth" },
  colors: [
    "var(--mui-palette-success-main)",
    "var(--mui-palette-warning-main)",
  ],
  fill: {
    type: "gradient",
    gradient: {
      shadeIntensity: 0.2,
      opacityFrom: 0.24,
      opacityTo: 0.04,
      stops: [0, 95, 100],
    },
  },
  dataLabels: { enabled: false },
  grid: {
    borderColor: "var(--mui-palette-divider)",
    strokeDashArray: 6,
    padding: { top: -8, left: -2, right: 8, bottom: -10 },
  },
  legend: {
    position: "top",
    horizontalAlign: "left",
    fontSize: "13px",
    fontFamily: theme.typography.fontFamily,
    labels: { colors: "var(--mui-palette-text-secondary)" },
    itemMargin: { horizontal: 10 },
  },
  xaxis: {
    categories,
    axisTicks: { show: false },
    axisBorder: { show: false },
    labels: {
      style: {
        colors: DISABLED_TEXT,
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.body2.fontSize as string,
      },
    },
  },
  yaxis: {
    labels: {
      formatter: (value) => formatCompactPeso(Number(value)),
      style: {
        colors: DISABLED_TEXT,
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.body2.fontSize as string,
      },
    },
  },
  tooltip: {
    theme: "dark",
    y: { formatter: (value) => formatCompactPeso(Number(value)) },
  },
});

/** Posted / Draft / Reversed status share (donut, success/warning/error). */
export const buildStatusMixOptions = (
  theme: Theme,
  postedPercent: number,
): ApexOptions => ({
  chart: { parentHeightOffset: 0, toolbar: { show: false } },
  labels: ["Posted", "Draft", "Reversed"],
  colors: [
    "var(--mui-palette-success-main)",
    "var(--mui-palette-warning-main)",
    "var(--mui-palette-error-main)",
  ],
  stroke: { colors: ["var(--mui-palette-background-paper)"] },
  legend: {
    position: "bottom",
    fontSize: "13px",
    fontFamily: theme.typography.fontFamily,
    labels: { colors: "var(--mui-palette-text-secondary)" },
    itemMargin: { horizontal: 10, vertical: 6 },
  },
  dataLabels: { enabled: false },
  plotOptions: {
    pie: {
      donut: {
        size: "70%",
        labels: {
          show: true,
          value: {
            fontSize: "24px",
            fontWeight: 700,
            color: "var(--mui-palette-text-primary)",
            fontFamily: theme.typography.fontFamily,
            formatter: (value) => `${Number(value).toFixed(0)}%`,
          },
          total: {
            show: true,
            label: "Posted Rate",
            color: "var(--mui-palette-text-secondary)",
            fontFamily: theme.typography.fontFamily,
            formatter: () => `${postedPercent.toFixed(0)}%`,
          },
        },
      },
    },
  },
  tooltip: {
    theme: "dark",
    y: { formatter: (value) => `${Number(value).toFixed(0)}% of entries` },
  },
});

/** Posted / Draft / Reversed entry counts per month (stacked bar). */
export const buildStatusFlowOptions = ({
  theme,
  categories,
}: AreaContext): ApexOptions => ({
  chart: { stacked: true, parentHeightOffset: 0, toolbar: { show: false } },
  colors: [
    "var(--mui-palette-success-main)",
    "var(--mui-palette-warning-main)",
    "var(--mui-palette-error-main)",
  ],
  dataLabels: { enabled: false },
  stroke: { width: 4, colors: ["var(--mui-palette-background-paper)"] },
  plotOptions: {
    bar: {
      borderRadius: 7,
      columnWidth: "44%",
      borderRadiusApplication: "around",
      borderRadiusWhenStacked: "all",
    },
  },
  grid: {
    borderColor: "var(--mui-palette-divider)",
    yaxis: { lines: { show: false } },
    padding: { top: -6, left: -8, right: 8, bottom: -8 },
  },
  legend: {
    position: "top",
    horizontalAlign: "left",
    fontSize: "13px",
    fontFamily: theme.typography.fontFamily,
    labels: { colors: "var(--mui-palette-text-secondary)" },
    itemMargin: { horizontal: 10 },
  },
  xaxis: {
    categories,
    axisTicks: { show: false },
    axisBorder: { show: false },
    labels: {
      style: {
        colors: DISABLED_TEXT,
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.body2.fontSize as string,
      },
    },
  },
  yaxis: {
    labels: {
      style: {
        colors: DISABLED_TEXT,
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.body2.fontSize as string,
      },
    },
  },
  tooltip: {
    theme: "dark",
    y: { formatter: (value) => `${Math.round(Number(value))} entries` },
  },
});
