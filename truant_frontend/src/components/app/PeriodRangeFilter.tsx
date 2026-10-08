"use client";

import { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import CustomDatePicker from "@components/app/CustomDatePicker";
import CustomTextField from "@core/components/mui/TextField";

import {
  canNavigateToNextMonth,
  DATE_RANGE_PRESET_LABELS,
  DEFAULT_DATE_RANGE_PRESETS,
  getPresetRange,
  isCalendarMonthRange,
  shiftCalendarMonth,
  type DateRangePreset,
  type DateRangeValue,
} from "@/utils/dateRange";

const mediumDate = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila",
});

const monthYear = new Intl.DateTimeFormat("en-PH", {
  month: "long",
  year: "numeric",
  timeZone: "Asia/Manila",
});

const formatDisplay = (value: string): string => {
  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? value : mediumDate.format(date);
};

type PeriodRangeFilterProps = {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  presets?: DateRangePreset[];
  disabled?: boolean;
  label?: string;
  /**
   * `horizontal` (default) lays the controls out in a wrapping row for toolbars
   * and filter bars; `vertical` stacks them full-width for narrow containers
   * such as the general-ledger filter drawer (avoids clipped date inputs).
   */
  orientation?: "horizontal" | "vertical";
  /** Hide the resolved-range caption (shown by default). */
  hideCaption?: boolean;
  /** Show previous/next controls when the value is one calendar month. */
  enableMonthNavigation?: boolean;
};

/**
 * Reusable period filter: a Sneat select of date-range presets (This Month,
 * This Year, …) plus a compact dialog for custom From/To dates. Emits a
 * `{ preset, from, to }` value so every period filter in the app — accounting
 * reports, general ledger, ordering billing statements — behaves identically.
 * Curate the options per screen with `presets`.
 */
const PeriodRangeFilter = ({
  value,
  onChange,
  presets = DEFAULT_DATE_RANGE_PRESETS,
  disabled,
  label = "Period",
  orientation = "horizontal",
  hideCaption,
  enableMonthNavigation,
}: PeriodRangeFilterProps) => {
  const theme = useTheme();
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down("sm"));
  const isVertical = orientation === "vertical";
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [draftRange, setDraftRange] = useState({
    from: value.from,
    to: value.to,
  });

  useEffect(() => {
    if (!customDialogOpen) {
      setDraftRange({ from: value.from, to: value.to });
    }
  }, [customDialogOpen, value.from, value.to]);

  const selectPreset = (preset: DateRangePreset) => {
    if (preset === "custom") {
      setDraftRange({ from: value.from, to: value.to });
      setCustomDialogOpen(true);

      return;
    }

    onChange({ preset, ...getPresetRange(preset) });
  };

  const applyCustomRange = () => {
    onChange({ preset: "custom", ...draftRange });
    setCustomDialogOpen(false);
  };

  const caption =
    value.preset === "all"
      ? "Showing all records"
      : `${formatDisplay(value.from)} – ${formatDisplay(value.to)}`;
  const isMonthly =
    Boolean(enableMonthNavigation) && isCalendarMonthRange(value);
  const canMoveNext = isMonthly && canNavigateToNextMonth(value);
  const monthLabel = isMonthly
    ? monthYear.format(new Date(`${value.from}T00:00:00`))
    : "";

  const customRangeError =
    Boolean(draftRange.from) &&
    Boolean(draftRange.to) &&
    draftRange.from > draftRange.to;

  return (
    <Stack spacing={1} sx={{ width: isVertical ? "100%" : "auto" }}>
      <Stack
        direction={isVertical ? "column" : { xs: "column", sm: "row" }}
        spacing={2}
        useFlexGap
        sx={{
          flexWrap: isVertical ? "nowrap" : "wrap",
          alignItems: isVertical ? "stretch" : { sm: "flex-start" },
        }}
      >
        <CustomTextField
          select
          label={label || undefined}
          value={value.preset}
          disabled={disabled}
          fullWidth={isVertical}
          sx={isVertical ? undefined : { minWidth: { sm: 190 } }}
          onChange={(event) =>
            selectPreset(event.target.value as DateRangePreset)
          }
        >
          {presets.map((preset) => (
            <MenuItem key={preset} value={preset}>
              {DATE_RANGE_PRESET_LABELS[preset]}
            </MenuItem>
          ))}
        </CustomTextField>

        {isMonthly && (
          <Stack
            direction="row"
            alignItems="center"
            onKeyDown={(event) => {
              if (disabled) return;

              if (event.key === "ArrowLeft") {
                event.preventDefault();
                onChange(shiftCalendarMonth(value, -1));
              }

              if (event.key === "ArrowRight" && canMoveNext) {
                event.preventDefault();
                onChange(shiftCalendarMonth(value, 1));
              }
            }}
            sx={{
              minHeight: 40,
              alignSelf: isVertical ? "stretch" : { sm: "flex-end" },
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              bgcolor: "background.paper",
            }}
          >
            <Tooltip title="Previous month">
              <span>
                <IconButton
                  size="small"
                  aria-label="Previous month"
                  disabled={disabled}
                  onClick={() => onChange(shiftCalendarMonth(value, -1))}
                >
                  <i className="bx bx-chevron-left" />
                </IconButton>
              </span>
            </Tooltip>
            <Typography
              variant="body2"
              fontWeight={600}
              textAlign="center"
              tabIndex={disabled ? -1 : 0}
              aria-label={`Selected month ${monthLabel}. Use left and right arrow keys to change month.`}
              sx={{ minWidth: 118, px: 1, whiteSpace: "nowrap" }}
            >
              {monthLabel}
            </Typography>
            <Tooltip title={canMoveNext ? "Next month" : "Current month"}>
              <span>
                <IconButton
                  size="small"
                  aria-label="Next month"
                  disabled={disabled || !canMoveNext}
                  onClick={() => onChange(shiftCalendarMonth(value, 1))}
                >
                  <i className="bx bx-chevron-right" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        )}

        {value.preset === "custom" && (
          <Button
            variant="tonal"
            color="secondary"
            startIcon={<i className="bx bx-calendar-edit" />}
            disabled={disabled}
            onClick={() => {
              setDraftRange({ from: value.from, to: value.to });
              setCustomDialogOpen(true);
            }}
            sx={{
              minHeight: 40,
              alignSelf: isVertical ? "stretch" : { sm: "flex-end" },
            }}
          >
            Edit Dates
          </Button>
        )}
      </Stack>

      {!hideCaption && (
        <Typography variant="caption" color="text.secondary">
          {caption}
        </Typography>
      )}

      <Dialog
        open={customDialogOpen}
        onClose={() => setCustomDialogOpen(false)}
        fullScreen={fullScreenDialog}
        fullWidth
        maxWidth="xs"
        closeAfterTransition
        aria-labelledby="custom-range-dialog-title"
      >
        <DialogTitle id="custom-range-dialog-title">
          Custom Date Range
        </DialogTitle>
        <DialogContent>
          <Stack spacing={4} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Select the exact period for this view.
            </Typography>

            <Box>
              <CustomDatePicker
                label="From"
                value={draftRange.from}
                disabled={disabled}
                error={customRangeError}
                onChange={(from) =>
                  setDraftRange((current) => ({ ...current, from }))
                }
              />
            </Box>

            <CustomDatePicker
              label="To"
              value={draftRange.to}
              disabled={disabled}
              error={customRangeError}
              helperText={
                customRangeError
                  ? "To date must be on or after the from date."
                  : undefined
              }
              onChange={(to) =>
                setDraftRange((current) => ({ ...current, to }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            color="secondary"
            variant="tonal"
            onClick={() => setCustomDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={
              disabled || customRangeError || !draftRange.from || !draftRange.to
            }
            onClick={applyCustomRange}
          >
            Apply Range
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default PeriodRangeFilter;
