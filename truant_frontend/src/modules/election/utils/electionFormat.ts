import { ApiError } from "@/libs/api/apiError";

/** Dates arrive as `YYYY-MM-DD`; parse them as local dates to avoid a day shift. */
export const formatDate = (value?: string | null): string => {
  if (!value) return "—";

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

export const formatDateTime = (value?: string | null): string => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
};

export const getElectionErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string => {
  if (error instanceof ApiError) {
    const firstValidation = Object.values(error.errors).flat()[0];

    return firstValidation ?? error.message ?? fallback;
  }

  return error instanceof Error ? error.message : fallback;
};
