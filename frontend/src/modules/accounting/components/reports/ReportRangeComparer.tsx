"use client";

import { useEffect } from "react";

import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";

import CustomDatePicker from "@components/app/CustomDatePicker";

import type { DateRange } from "@/utils/dateRange";

export type ComparisonMode = "previous_period" | "prior_year" | "custom";

export type ReportComparisonValue = DateRange & {
  enabled: boolean;
  mode: ComparisonMode;
};

const displayDate = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila",
});

const parseDate = (value: string) => new Date(`${value}T00:00:00`);

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const shiftYear = (value: string) => {
  const date = parseDate(value);
  const month = date.getMonth();

  date.setFullYear(date.getFullYear() - 1);
  if (date.getMonth() !== month) date.setDate(0);

  return toIsoDate(date);
};

export const comparisonRangeFor = (
  primary: DateRange,
  mode: Exclude<ComparisonMode, "custom">,
): DateRange => {
  if (mode === "prior_year") {
    return { from: shiftYear(primary.from), to: shiftYear(primary.to) };
  }

  const from = parseDate(primary.from);
  const to = parseDate(primary.to);
  const duration = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
  const comparisonTo = new Date(from);

  comparisonTo.setDate(comparisonTo.getDate() - 1);
  const comparisonFrom = new Date(comparisonTo);

  comparisonFrom.setDate(comparisonFrom.getDate() - duration + 1);

  return { from: toIsoDate(comparisonFrom), to: toIsoDate(comparisonTo) };
};

export const defaultComparisonValue = (
  primary: DateRange,
): ReportComparisonValue => ({
  enabled: false,
  mode: "previous_period",
  ...comparisonRangeFor(primary, "previous_period"),
});

const formatRange = ({ from, to }: DateRange) =>
  `${displayDate.format(parseDate(from))} – ${displayDate.format(parseDate(to))}`;

type Props = {
  primary: DateRange;
  value: ReportComparisonValue;
  onChange: (value: ReportComparisonValue) => void;
  disabled?: boolean;
};

const ReportRangeComparer = ({
  primary,
  value,
  onChange,
  disabled = false,
}: Props) => {
  useEffect(() => {
    if (!value.enabled || value.mode === "custom") return;
    const next = comparisonRangeFor(primary, value.mode);

    if (next.from !== value.from || next.to !== value.to) {
      onChange({ ...value, ...next });
    }
  }, [onChange, primary, value]);

  const setEnabled = (enabled: boolean) => {
    const range =
      value.mode === "custom"
        ? { from: value.from, to: value.to }
        : comparisonRangeFor(primary, value.mode);

    onChange({ ...value, ...range, enabled });
  };

  const setMode = (mode: ComparisonMode | null) => {
    if (!mode) return;
    const range =
      mode === "custom"
        ? { from: value.from, to: value.to }
        : comparisonRangeFor(primary, mode);

    onChange({ ...value, ...range, mode });
  };

  const invalidCustomRange =
    value.mode === "custom" &&
    (!value.from || !value.to || value.from > value.to);

  return (
    <Stack spacing={2} sx={{ borderTop: 1, borderColor: "divider", pt: 3 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ md: "center" }}
        justifyContent="space-between"
      >
        <FormControlLabel
          control={
            <Switch
              checked={value.enabled}
              disabled={disabled}
              onChange={(_, checked) => setEnabled(checked)}
            />
          }
          label="Compare periods"
        />

        {value.enabled && (
          <ToggleButtonGroup
            exclusive
            size="small"
            color="primary"
            value={value.mode}
            onChange={(_, mode: ComparisonMode | null) => setMode(mode)}
            aria-label="Comparison period"
          >
            <ToggleButton value="previous_period">Previous Period</ToggleButton>
            <ToggleButton value="prior_year">Prior Year</ToggleButton>
            <ToggleButton value="custom">Custom</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Stack>

      {value.enabled && value.mode === "custom" && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <CustomDatePicker
            label="Compare From"
            value={value.from}
            disabled={disabled}
            error={invalidCustomRange}
            onChange={(from) => onChange({ ...value, from })}
          />
          <CustomDatePicker
            label="Compare To"
            value={value.to}
            disabled={disabled}
            error={invalidCustomRange}
            helperText={
              invalidCustomRange
                ? "Compare To must be on or after Compare From."
                : undefined
            }
            onChange={(to) => onChange({ ...value, to })}
          />
        </Stack>
      )}

      {value.enabled && !invalidCustomRange && (
        <Typography variant="caption" color="text.secondary">
          {formatRange(primary)} compared with {formatRange(value)}
        </Typography>
      )}
    </Stack>
  );
};

export default ReportRangeComparer;
