"use client";

import type { ReactNode } from "react";

import dayjs, { type Dayjs } from "dayjs";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";

const toDayjs = (value: string): Dayjs | null => {
  if (!value) return null;

  const date = dayjs(value);

  return date.isValid() ? date : null;
};

const normalizeDateFormat = (format: string): string => {
  return format.replaceAll("yyyy", "YYYY").replaceAll("dd", "DD");
};

const CalendarIcon = () => <i className="bx bx-calendar" />;

export type CustomDatePickerProps = {
  label?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: ReactNode;
  required?: boolean;
  fullWidth?: boolean;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  isClearable?: boolean;
  dateFormat?: string;
  mode?: "date" | "month";
};

const CustomDatePicker = ({
  label,
  value,
  onChange,
  disabled,
  error,
  helperText,
  required,
  fullWidth = true,
  placeholder: _placeholder,
  minDate,
  maxDate,
  isClearable,
  dateFormat,
  mode = "date",
}: CustomDatePickerProps) => {
  const pickerFormat =
    dateFormat ?? (mode === "month" ? "MMMM yyyy" : "yyyy-MM-dd");

  return (
    <DatePicker
      label={label}
      value={toDayjs(value)}
      onChange={(date) =>
        onChange(
          date?.isValid()
            ? date.format(mode === "month" ? "YYYY-MM" : "YYYY-MM-DD")
            : "",
        )
      }
      disabled={disabled}
      format={normalizeDateFormat(pickerFormat)}
      views={mode === "month" ? ["year", "month"] : undefined}
      openTo={mode === "month" ? "month" : undefined}
      minDate={minDate ? dayjs(minDate) : undefined}
      maxDate={maxDate ? dayjs(maxDate) : undefined}
      closeOnSelect
      slots={{
        openPickerIcon: CalendarIcon,
      }}
      slotProps={{
        textField: {
          fullWidth,
          required,
          error,
          helperText,
          size: "small",
        },
        field: {
          clearable: Boolean(isClearable && !disabled),
          onClear: () => onChange(""),
        } as any,
        actionBar: {
          actions: isClearable ? ["clear", "cancel", "accept"] : [],
        },
        popper: {
          placement: "bottom-start",
          disablePortal: false,
          sx: {
            zIndex: (theme) => theme.zIndex.modal + 10,
          },
        },
      }}
    />
  );
};

export default CustomDatePicker;
