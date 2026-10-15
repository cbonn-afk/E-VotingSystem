import type { ApexOptions } from "apexcharts";
import type { Theme } from "@mui/material/styles";

const DISABLED_TEXT = "var(--mui-palette-text-disabled)";

/** Donut with a count total in the middle — used for status distributions. */
export const buildDonutOptions = (
  theme: Theme,
  labels: string[],
  colors: string[],
  centerLabel: string,
  centerValue: number,
): ApexOptions => ({
  chart: { parentHeightOffset: 0, toolbar: { show: false } },
  labels,
  colors,
  stroke: { colors: ["var(--mui-palette-background-paper)"] },
  legend: { show: false },
  dataLabels: { enabled: false },
  plotOptions: {
    pie: {
      donut: {
        size: "72%",
        labels: {
          show: true,
          value: {
            fontSize: "22px",
            fontWeight: 700,
            color: "var(--mui-palette-text-primary)",
            fontFamily: theme.typography.fontFamily,
            formatter: (value) => String(value),
          },
          total: {
            show: true,
            label: centerLabel,
            color: "var(--mui-palette-text-secondary)",
            fontFamily: theme.typography.fontFamily,
            formatter: () => String(centerValue),
          },
        },
      },
    },
  },
  tooltip: {
    theme: "dark",
    y: { formatter: (value) => `${Math.round(Number(value))}` },
  },
});

/** Per-bar coloured column chart — used for the payroll workflow counts. */
export const buildPayrollBarOptions = (
  theme: Theme,
  categories: string[],
  colors: string[],
): ApexOptions => ({
  chart: { parentHeightOffset: 0, toolbar: { show: false } },
  colors,
  dataLabels: {
    enabled: true,
    offsetY: -20,
    formatter: (value) => `${Math.round(Number(value))}`,
    style: {
      fontFamily: theme.typography.fontFamily,
      fontWeight: 600,
      colors: ["var(--mui-palette-text-secondary)"],
    },
  },
  plotOptions: {
    bar: {
      distributed: true,
      borderRadius: 8,
      columnWidth: "45%",
      borderRadiusApplication: "end",
      dataLabels: { position: "top" },
    },
  },
  grid: {
    borderColor: "var(--mui-palette-divider)",
    strokeDashArray: 6,
    yaxis: { lines: { show: true } },
    padding: { top: 0, left: -4, right: 8, bottom: -4 },
  },
  legend: { show: false },
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
      formatter: (value) => `${Math.round(Number(value))}`,
      style: {
        colors: DISABLED_TEXT,
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.body2.fontSize as string,
      },
    },
  },
  tooltip: {
    theme: "dark",
    y: {
      formatter: (value) =>
        `${Math.round(Number(value))} run${Number(value) === 1 ? "" : "s"}`,
    },
  },
});
