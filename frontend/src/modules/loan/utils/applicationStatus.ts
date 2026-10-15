import type { ApplicationStatus } from "../types";

type Color = "default" | "primary" | "secondary" | "success" | "warning" | "error" | "info";

export const applicationStatusLabel: Record<ApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  document_review: "Document review",
  returned: "Returned for correction",
  for_evaluation: "For evaluation",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const applicationStatusColor: Record<ApplicationStatus, Color> = {
  draft: "default",
  submitted: "info",
  document_review: "info",
  returned: "warning",
  for_evaluation: "success",
  rejected: "error",
  cancelled: "default",
};

/** Statuses staff can filter by (drafts are private to the member). */
export const staffStatusFilters: ApplicationStatus[] = [
  "submitted",
  "document_review",
  "returned",
  "for_evaluation",
  "rejected",
  "cancelled",
];

export const formatPeso = (value: string | number): string =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(Number(value));

export const formatDateTime = (iso: string | null): string =>
  iso ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)) : "";
