"use client";

import type { ReactNode } from "react";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

type DatePickerProviderProps = {
  children: ReactNode;
};

const DatePickerProvider = ({ children }: DatePickerProviderProps) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {children}
    </LocalizationProvider>
  );
};

export default DatePickerProvider;
