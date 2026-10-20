import type { ApplicationStatus } from "../types";

type Color = "default" | "primary" | "secondary" | "success" | "warning" | "error" | "info";

export const applicationStatusLabel: Record<ApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  document_review: "Under review",
  returned: "Returned for correction",
  for_evaluation: "For evaluation",
  for_approval: "For approval",
  approved: "Approved",
  for_agreement: "Ready for release",
  for_release: "Ready for release",
  released: "Released",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const applicationStatusColor: Record<ApplicationStatus, Color> = {
  draft: "default",
  submitted: "info",
  document_review: "info",
  returned: "warning",
  for_evaluation: "primary",
  for_approval: "primary",
  approved: "success",
  for_agreement: "warning",
  for_release: "info",
  released: "success",
  rejected: "error",
  cancelled: "default",
};

/** Statuses staff can filter by (drafts are private to the member). */
export const staffStatusFilters: ApplicationStatus[] = [
  "submitted",
  "document_review",
  "returned",
  "for_evaluation",
  "for_approval",
  "approved",
  "for_agreement",
  "for_release",
  "released",
  "rejected",
  "cancelled",
];

export const formatPeso = (value: string | number): string =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(Number(value));

export const formatDateTime = (iso: string | null): string =>
  iso ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)) : "";

/** A date-only value such as "2026-11-15", shown without any time-zone shift. */
export const formatDate = (value: string | null): string => {
  if (!value) return "";

  const [year, month, day] = value.slice(0, 10).split("-").map(Number);

  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(year, month - 1, day));
};

export const frequencyLabel = { weekly: "Weekly", semi_monthly: "Twice a month", monthly: "Monthly" } as const;
export const interestMethodLabel = { diminishing: "Diminishing balance", flat: "Flat rate" } as const;
export const paymentMethodLabel = {
  cash: "Cash",
  check: "Check",
  bank_transfer: "Bank transfer",
  savings_deduction: "Deducted from savings",
} as const;

export const scheduleStatusLabel = { paid: "Paid", partial: "Partly paid", overdue: "Overdue", due: "Due today", upcoming: "Upcoming" } as const;
export const scheduleStatusColor = { paid: "success", partial: "info", overdue: "error", due: "warning", upcoming: "default" } as const;

/** The penalty rule in plain words, e.g. for the agreement and the loan screen. */
export const describePenalty = (rate: string, basis: string, calculation: string, graceDays: number): string => {
  if (Number(rate) <= 0) return "No late penalty";

  const on = basis === "principal_balance" ? "the overdue principal" : "the overdue installment";
  const how = calculation === "daily_prorated" ? "charged by the day (1/30 of the monthly rate for each day late)" : "for each month or part of a month late";
  const grace = graceDays > 0 ? `, starting after a ${graceDays}-day grace period` : "";

  return `${Number(rate)}% a month on ${on}, ${how}${grace}`;
};

export const releaseMethodLabel = {
  cash: "Cash",
  check: "Check",
  bank_transfer: "Bank transfer",
  savings_credit: "Credit to savings account",
} as const;
