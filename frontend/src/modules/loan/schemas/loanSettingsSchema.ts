import { z } from "zod";

import type { LoanSettings } from "../types";

/** 192.168.1.10, 192.168.1.0/24, 2001:db8::/32 */
export const isValidNetwork = (value: string): boolean => {
  const [ip, mask, ...rest] = value.trim().split("/");

  if (rest.length > 0 || !ip) return false;

  const isV4 = /^(\d{1,3})(\.\d{1,3}){3}$/.test(ip) && ip.split(".").every((part) => Number(part) <= 255);
  const isV6 = ip.includes(":") && /^[0-9a-fA-F:.]+$/.test(ip);

  if (!isV4 && !isV6) return false;
  if (mask === undefined) return true;

  return /^\d{1,3}$/.test(mask) && Number(mask) <= (isV4 ? 32 : 128);
};

export const parseNetworks = (text: string): string[] =>
  Array.from(new Set(text.split(/[\n,]+/).map((line) => line.trim()).filter(Boolean)));

export const loanSettingsSchema = z
  .object({
    portal_access_mode: z.enum(["network_only", "online"]),
    networksText: z.string(),
    session_idle_minutes: z.string().regex(/^\d+$/, "Enter a whole number of minutes."),
    signature_required: z.boolean(),
    diminishing_method: z.enum(["equal_installment", "fixed_principal"]),
    fee_handling: z.enum(["deduct_from_proceeds", "collect_separately"]),
    payment_allocation: z.enum(["penalty_interest_principal", "interest_penalty_principal"]),
    penalty_basis: z.enum(["installment", "principal_balance"]),
    penalty_rate_source: z.enum(["coop_default", "product"]),
    default_penalty_rate_percent: z
      .string()
      .regex(/^\d{1,3}(\.\d{1,3})?$/, "Enter a percentage like 2 or 1.5.")
      .refine((value) => Number(value) <= 100, "A penalty cannot be more than 100% a month."),
    penalty_calculation: z.enum(["per_month_or_fraction", "daily_prorated"]),
    delinquent_after_days: z.string().regex(/^\d+$/, "Enter a whole number of days."),
    default_after_days: z.string().regex(/^\d+$/, "Enter a whole number of days."),
    agreement_terms: z.string().trim().min(1, "The agreement needs terms and conditions.").max(8000, "Keep the terms under 8,000 characters."),
  })
  .superRefine((values, context) => {
    const minutes = Number(values.session_idle_minutes);

    if (minutes < 5 || minutes > 120) {
      context.addIssue({
        code: "custom",
        path: ["session_idle_minutes"],
        message: "Use between 5 and 120 minutes.",
      });
    }

    const delinquent = Number(values.delinquent_after_days);
    const defaulted = Number(values.default_after_days);

    if (delinquent < 1 || delinquent > 365) {
      context.addIssue({ code: "custom", path: ["delinquent_after_days"], message: "Use between 1 and 365 days." });
    }

    if (defaulted <= delinquent) {
      context.addIssue({ code: "custom", path: ["default_after_days"], message: "A loan goes into default later than it becomes delinquent." });
    }

    const invalid = parseNetworks(values.networksText).filter((entry) => !isValidNetwork(entry));

    if (invalid.length > 0) {
      context.addIssue({
        code: "custom",
        path: ["networksText"],
        message: `Not a valid IP address or range: ${invalid.join(", ")}`,
      });
    }
  });

export type LoanSettingsFormValues = z.infer<typeof loanSettingsSchema>;

export const toFormValues = (settings: LoanSettings): LoanSettingsFormValues => ({
  portal_access_mode: settings.portal_access_mode,
  networksText: settings.allowed_networks.join("\n"),
  session_idle_minutes: String(settings.session_idle_minutes),
  signature_required: settings.signature_required,
  diminishing_method: settings.diminishing_method,
  fee_handling: settings.fee_handling,
  payment_allocation: settings.payment_allocation,
  penalty_basis: settings.penalty_basis,
  penalty_rate_source: settings.penalty_rate_source,
  default_penalty_rate_percent: settings.default_penalty_rate_percent.replace(/\.?0+$/, "") || "0",
  penalty_calculation: settings.penalty_calculation,
  delinquent_after_days: String(settings.delinquent_after_days),
  default_after_days: String(settings.default_after_days),
  agreement_terms: settings.agreement_terms,
});

export const toRequest = (values: LoanSettingsFormValues): LoanSettings => ({
  portal_access_mode: values.portal_access_mode,
  allowed_networks: parseNetworks(values.networksText),
  session_idle_minutes: Number(values.session_idle_minutes),
  signature_required: values.signature_required,
  diminishing_method: values.diminishing_method,
  fee_handling: values.fee_handling,
  payment_allocation: values.payment_allocation,
  penalty_basis: values.penalty_basis,
  penalty_rate_source: values.penalty_rate_source,
  default_penalty_rate_percent: values.default_penalty_rate_percent,
  penalty_calculation: values.penalty_calculation,
  delinquent_after_days: Number(values.delinquent_after_days),
  default_after_days: Number(values.default_after_days),
  agreement_terms: values.agreement_terms.trim(),
});
