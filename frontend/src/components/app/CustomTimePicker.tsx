"use client";

import type { ReactNode } from "react";

import dayjs, { type Dayjs } from "dayjs";

import { TimePicker } from "@mui/x-date-pickers/TimePicker";

const toDayjs = (value: string): Dayjs | null => {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [hour, minute] = value.split(":").map(Number);
  const time = dayjs().hour(hour).minute(minute).second(0).millisecond(0);

  return time.isValid() ? time : null;
};

const toTime = (value: Dayjs | null): string =>
  value?.isValid() ? value.format("HH:mm") : "";

const ClockIcon = () => <i className="bx bx-time-five" />;

export type CustomTimePickerProps = {
  label?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: ReactNode;
  required?: boolean;
  fullWidth?: boolean;
  isClearable?: boolean;
};

const CustomTimePicker = ({
  label,
  value,
  onChange,
  disabled,
  error,
  helperText,
  required,
  fullWidth = true,
  isClearable,
}: CustomTimePickerProps) => (
  <TimePicker
    label={label}
    value={toDayjs(value)}
    onChange={(time) => onChange(toTime(time))}
    disabled={disabled}
    ampm
    closeOnSelect
    slots={{ openPickerIcon: ClockIcon }}
    slotProps={{
      textField: { fullWidth, required, error, helperText, size: "small" },
      field: {
        clearable: Boolean(isClearable && !disabled),
        onClear: () => onChange(""),
      } as any,
      actionBar: {
        actions: isClearable
          ? ["clear", "cancel", "accept"]
          : ["cancel", "accept"],
      },
      popper: {
        placement: "bottom-start",
        disablePortal: false,
        sx: { zIndex: (theme) => theme.zIndex.modal + 10 },
      },
    }}
  />
);

export default CustomTimePicker;
