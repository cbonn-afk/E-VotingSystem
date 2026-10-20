import { z } from "zod";

import type { PaymentMethod, RecordPaymentPayload } from "../types";

type Limits = {
  /** Everything still owed today, in pesos. A payment cannot be larger. */
  payoff: number;
  /** Today as YYYY-MM-DD. */
  today: string;
  /** The earliest allowed date: the release day or the last payment. */
  earliest: string;
};

export const paymentSchema = (limits: Limits) =>
  z
    .object({
      amount: z.string().regex(/^\d{1,8}(\.\d{1,2})?$/, "Enter an amount like 1500 or 1500.50."),
      paid_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the payment date."),
      method: z.enum(["cash", "check", "bank_transfer", "savings_deduction"]),
      reference_no: z.string().max(80),
      remarks: z.string().max(500),
    })
    .superRefine((values, context) => {
      const amount = Number(values.amount);

      if (amount <= 0) {
        context.addIssue({ code: "custom", path: ["amount"], message: "Enter an amount greater than zero." });
      } else if (Math.round(amount * 100) > Math.round(limits.payoff * 100)) {
        context.addIssue({ code: "custom", path: ["amount"], message: `That is more than the whole balance of ${limits.payoff.toLocaleString("en-PH", { minimumFractionDigits: 2 })}.` });
      }

      if (values.paid_on > limits.today) {
        context.addIssue({ code: "custom", path: ["paid_on"], message: "The payment date cannot be in the future." });
      } else if (values.paid_on < limits.earliest) {
        context.addIssue({ code: "custom", path: ["paid_on"], message: `The date cannot be before ${limits.earliest}: the day the loan was released or the last payment.` });
      }

      if (values.method !== "cash" && values.reference_no.trim() === "") {
        context.addIssue({ code: "custom", path: ["reference_no"], message: "Enter the check, transfer or deduction reference." });
      }
    });

export type PaymentFormValues = z.infer<ReturnType<typeof paymentSchema>>;

export const toPaymentPayload = (values: PaymentFormValues): RecordPaymentPayload => ({
  amount: values.amount,
  paid_on: values.paid_on,
  method: values.method as PaymentMethod,
  reference_no: values.reference_no.trim() === "" ? null : values.reference_no.trim(),
  remarks: values.remarks.trim() === "" ? null : values.remarks.trim(),
});
