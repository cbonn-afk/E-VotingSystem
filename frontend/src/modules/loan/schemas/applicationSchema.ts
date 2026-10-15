import { z } from "zod";

import type { ApplicationDetailsPayload, LoanApplication, LoanProduct } from "../types";

const optionalMoney = z
  .string()
  .refine((value) => value === "" || /^\d{1,8}(\.\d{1,2})?$/.test(value), "Enter an amount like 15000 or 15000.50.");

/** The rules depend on the chosen product (limits, collateral), so the schema is built per product. */
export const applicationDetailsSchema = (product: LoanProduct) =>
  z
    .object({
      amount: z.string().regex(/^\d{1,8}(\.\d{1,2})?$/, "Enter an amount like 20000 or 20000.50."),
      term_months: z.string().regex(/^\d+$/, "Enter a whole number of months."),
      purpose: z.string().trim().min(1, "Describe the purpose of the loan.").max(1000),
      monthly_income: optionalMoney,
      employer_business: z.string().max(160),
      collateral_description: z.string().max(500),
      collateral_value: optionalMoney,
    })
    .superRefine((values, context) => {
      const amount = Number(values.amount);
      const term = Number(values.term_months);

      if (amount < Number(product.min_amount) || amount > Number(product.max_amount)) {
        context.addIssue({
          code: "custom",
          path: ["amount"],
          message: `The amount must be between ${Number(product.min_amount).toLocaleString("en-PH")} and ${Number(product.max_amount).toLocaleString("en-PH")}.`,
        });
      }

      if (term < product.term_min_months || term > product.term_max_months) {
        context.addIssue({
          code: "custom",
          path: ["term_months"],
          message: `The term must be between ${product.term_min_months} and ${product.term_max_months} months.`,
        });
      }

      if (product.requires_collateral) {
        if (values.collateral_description.trim() === "") {
          context.addIssue({ code: "custom", path: ["collateral_description"], message: "Describe the collateral." });
        }
        if (values.collateral_value === "") {
          context.addIssue({ code: "custom", path: ["collateral_value"], message: "Enter the collateral's estimated value." });
        }
      }
    });

export type ApplicationDetailsValues = z.infer<ReturnType<typeof applicationDetailsSchema>>;

export const emptyDetails: ApplicationDetailsValues = {
  amount: "",
  term_months: "",
  purpose: "",
  monthly_income: "",
  employer_business: "",
  collateral_description: "",
  collateral_value: "",
};

const trimDecimal = (value: string | null): string => {
  if (value === null) return "";

  return value.includes(".") ? value.replace(/\.?0+$/, "") : value;
};

export const toDetailsForm = (application: LoanApplication): ApplicationDetailsValues => ({
  amount: trimDecimal(application.amount),
  term_months: String(application.term_months),
  purpose: application.purpose,
  monthly_income: trimDecimal(application.monthly_income),
  employer_business: application.employer_business ?? "",
  collateral_description: application.collateral_description ?? "",
  collateral_value: trimDecimal(application.collateral_value),
});

export const toDetailsPayload = (values: ApplicationDetailsValues): ApplicationDetailsPayload => ({
  amount: values.amount,
  term_months: Number(values.term_months),
  purpose: values.purpose.trim(),
  monthly_income: values.monthly_income === "" ? null : values.monthly_income,
  employer_business: values.employer_business.trim() === "" ? null : values.employer_business.trim(),
  collateral_description: values.collateral_description.trim() === "" ? null : values.collateral_description.trim(),
  collateral_value: values.collateral_value === "" ? null : values.collateral_value,
});

/** "M-0002, M-0003" or one per line -> ["M-0002", "M-0003"] */
export const parseCodes = (text: string): string[] =>
  Array.from(new Set(text.split(/[\n,]+/).map((code) => code.trim()).filter(Boolean)));
