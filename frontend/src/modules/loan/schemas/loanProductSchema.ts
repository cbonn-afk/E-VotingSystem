import { z } from "zod";

import type { LoanProduct, LoanProductPayload } from "../types";

const money = (label: string) =>
  z.string().regex(/^\d{1,8}(\.\d{1,2})?$/, `${label}: enter an amount like 5000 or 5000.50.`);

const percent = (label: string) =>
  z
    .string()
    .regex(/^\d{1,3}(\.\d{1,3})?$/, `${label}: enter a number like 12 or 1.5.`)
    .refine((value) => Number(value) <= 100, `${label}: cannot be more than 100.`);

const whole = (label: string, max: number) =>
  z
    .string()
    .regex(/^\d+$/, `${label}: enter a whole number.`)
    .refine((value) => Number(value) <= max, `${label}: cannot be more than ${max}.`);

export const loanProductSchema = z
  .object({
    code: z.string().trim().min(1, "Code is required.").max(30).regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, - or _."),
    name: z.string().trim().min(1, "Name is required.").max(120),
    description: z.string().max(500),
    min_amount: money("Minimum amount"),
    max_amount: money("Maximum amount"),
    interest_rate: percent("Interest rate"),
    interest_method: z.enum(["diminishing", "flat"]),
    term_min_months: whole("Minimum term", 360),
    term_max_months: whole("Maximum term", 360),
    payment_frequency: z.enum(["weekly", "semi_monthly", "monthly"]),
    processing_fee_percent: percent("Processing fee"),
    service_fee_percent: percent("Service fee"),
    penalty_rate_percent: percent("Penalty rate"),
    grace_period_days: whole("Grace period", 365),
    requires_guarantor: z.boolean(),
    guarantor_count: whole("Guarantors", 5),
    requires_collateral: z.boolean(),
    min_membership_months: whole("Membership months", 600),
    status: z.enum(["active", "inactive"]),
    documents: z.array(z.object({ name: z.string().trim().min(1, "Name the document.").max(120), is_required: z.boolean() })).max(20),
  })
  .superRefine((values, context) => {
    if (Number(values.min_amount) < 1) {
      context.addIssue({ code: "custom", path: ["min_amount"], message: "Minimum amount must be at least 1." });
    }
    if (Number(values.max_amount) < Number(values.min_amount)) {
      context.addIssue({ code: "custom", path: ["max_amount"], message: "Maximum amount cannot be below the minimum." });
    }
    if (Number(values.term_min_months) < 1) {
      context.addIssue({ code: "custom", path: ["term_min_months"], message: "Minimum term must be at least 1 month." });
    }
    if (Number(values.term_max_months) < Number(values.term_min_months)) {
      context.addIssue({ code: "custom", path: ["term_max_months"], message: "Maximum term cannot be below the minimum." });
    }
    if (values.requires_guarantor && Number(values.guarantor_count) < 1) {
      context.addIssue({ code: "custom", path: ["guarantor_count"], message: "Enter how many guarantors are required." });
    }
  });

export type LoanProductFormValues = z.infer<typeof loanProductSchema>;

export const emptyProductForm: LoanProductFormValues = {
  code: "",
  name: "",
  description: "",
  min_amount: "",
  max_amount: "",
  interest_rate: "",
  interest_method: "diminishing",
  term_min_months: "",
  term_max_months: "",
  payment_frequency: "monthly",
  processing_fee_percent: "0",
  service_fee_percent: "0",
  penalty_rate_percent: "0",
  grace_period_days: "0",
  requires_guarantor: false,
  guarantor_count: "0",
  requires_collateral: false,
  min_membership_months: "0",
  status: "active",
  documents: [],
};

/** "5000.00" -> "5000", "12.000" -> "12" so the form shows what a person would type. */
const trimDecimal = (value: string): string => (value.includes(".") ? value.replace(/\.?0+$/, "") : value);

export const toProductForm = (product: LoanProduct): LoanProductFormValues => ({
  code: product.code,
  name: product.name,
  description: product.description ?? "",
  min_amount: trimDecimal(product.min_amount),
  max_amount: trimDecimal(product.max_amount),
  interest_rate: trimDecimal(product.interest_rate),
  interest_method: product.interest_method,
  term_min_months: String(product.term_min_months),
  term_max_months: String(product.term_max_months),
  payment_frequency: product.payment_frequency,
  processing_fee_percent: trimDecimal(product.processing_fee_percent),
  service_fee_percent: trimDecimal(product.service_fee_percent),
  penalty_rate_percent: trimDecimal(product.penalty_rate_percent),
  grace_period_days: String(product.grace_period_days),
  requires_guarantor: product.requires_guarantor,
  guarantor_count: String(product.guarantor_count),
  requires_collateral: product.requires_collateral,
  min_membership_months: String(product.min_membership_months),
  status: product.status,
  documents: product.documents,
});

export const toProductPayload = (values: LoanProductFormValues): LoanProductPayload => ({
  ...values,
  code: values.code.trim().toUpperCase(),
  name: values.name.trim(),
  description: values.description.trim() === "" ? null : values.description.trim(),
  term_min_months: Number(values.term_min_months),
  term_max_months: Number(values.term_max_months),
  grace_period_days: Number(values.grace_period_days),
  guarantor_count: values.requires_guarantor ? Number(values.guarantor_count) : 0,
  min_membership_months: Number(values.min_membership_months),
  documents: values.documents.map((d) => ({ name: d.name.trim(), is_required: d.is_required })),
});
