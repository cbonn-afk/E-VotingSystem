import { z } from "zod";

import type { EvaluationPayload, LoanApplication } from "../types";

const optionalMoney = z
  .string()
  .refine((value) => value === "" || /^\d{1,8}(\.\d{1,2})?$/.test(value), "Enter an amount like 15000 or 15000.50.");

/** The recommended amount is checked against what was requested and the product minimum. */
export const evaluationSchema = (application: Pick<LoanApplication, "amount" | "product">) =>
  z
    .object({
      recommendation: z.enum(["approve", "approve_lower", "reject"]),
      recommended_amount: optionalMoney,
      verified_income: optionalMoney,
      existing_obligations: optionalMoney,
      notes: z.string().trim().min(1, "Write your assessment so the approvers can see your reasoning.").max(2000),
    })
    .superRefine((values, context) => {
      if (values.recommendation !== "approve_lower") return;

      const amount = Number(values.recommended_amount);
      const requested = Number(application.amount);
      const minimum = Number(application.product?.min_amount ?? 0);

      if (values.recommended_amount === "" || amount <= 0) {
        context.addIssue({ code: "custom", path: ["recommended_amount"], message: "Enter the amount you recommend." });
      } else if (amount >= requested) {
        context.addIssue({ code: "custom", path: ["recommended_amount"], message: `It must be lower than the ${requested.toLocaleString("en-PH")} requested.` });
      } else if (amount < minimum) {
        context.addIssue({ code: "custom", path: ["recommended_amount"], message: `It cannot be below the product minimum of ${minimum.toLocaleString("en-PH")}.` });
      }
    });

export type EvaluationFormValues = z.infer<ReturnType<typeof evaluationSchema>>;

export const emptyEvaluation: EvaluationFormValues = {
  recommendation: "approve",
  recommended_amount: "",
  verified_income: "",
  existing_obligations: "",
  notes: "",
};

export const toEvaluationPayload = (values: EvaluationFormValues): EvaluationPayload => ({
  recommendation: values.recommendation,
  recommended_amount: values.recommendation === "approve_lower" ? values.recommended_amount : null,
  verified_income: values.verified_income === "" ? null : values.verified_income,
  existing_obligations: values.existing_obligations === "" ? null : values.existing_obligations,
  notes: values.notes.trim(),
});
