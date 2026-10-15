import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { ApiError } from "@/libs/api/apiError";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila",
});

export const formatPeso = (value: number | string | null | undefined): string =>
  peso.format(Number(value ?? 0));

/**
 * Signed peso change for year-over-year statement columns, e.g. "+₱1,200.00"
 * or "-₱300.00". Negative values already carry their own minus from the
 * currency formatter, so only the positive case needs an explicit "+".
 */
export const formatSignedPeso = (
  value: number | string | null | undefined,
): string => {
  const amount = Number(value ?? 0);

  return `${amount > 0 ? "+" : ""}${peso.format(amount)}`;
};

export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return "—";
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
};

export const formatDate = (value: string | null | undefined): string => {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
};

export const getAccountingErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string => {
  if (error instanceof ApiError) {
    const firstField = Object.values(error.errors ?? {})[0]?.[0];

    return firstField ?? error.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
};

/**
 * Maps Laravel 422 validation errors onto react-hook-form fields. Snake_case
 * server keys are converted to the camelCase form field names via `keyMap`.
 */
export const applyApiErrorsToForm = <T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  keyMap: Record<string, Path<T>> = {},
): boolean => {
  if (!(error instanceof ApiError) || error.status !== 422) {
    return false;
  }

  Object.entries(error.errors ?? {}).forEach(([field, messages]) => {
    const target = keyMap[field] ?? (field as Path<T>);
    setError(target, { type: "server", message: messages[0] });
  });

  return true;
};
