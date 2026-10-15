import { z } from "zod";

import { billPaymentOptions } from "../data/billOptions";

const accountType = z.enum([
  "asset",
  "liability",
  "equity",
  "revenue",
  "expense",
]);
const recordStatus = z.enum(["active", "inactive"]);

export const accountSchema = z.object({
  code: z.string().trim().min(1, "Code is required.").max(50),
  name: z.string().trim().min(1, "Name is required.").max(150),
  type: accountType,
  // Stored as strings in the form ("" = none); converted to ids on submit.
  parentId: z.string().optional().or(z.literal("")),
  accountTypeId: z.string().optional().or(z.literal("")),
  detailTypeId: z.string().optional().or(z.literal("")),
  isPosting: z.boolean(),
  isContra: z.boolean(),
  status: recordStatus,
  description: z.string().trim().max(255).optional().or(z.literal("")),
});

export type AccountFormValues = z.infer<typeof accountSchema>;

export const accountDefaults: AccountFormValues = {
  code: "",
  name: "",
  type: "asset",
  parentId: "",
  accountTypeId: "",
  detailTypeId: "",
  isPosting: true,
  isContra: false,
  status: "active",
  description: "",
};

const journalLine = z.object({
  accountId: z.string().min(1, "Select an account."),
  taxId: z.string().optional().or(z.literal("")),
  description: z.string().trim().max(250).optional().or(z.literal("")),
  debit: z.number().min(0, "Cannot be negative."),
  credit: z.number().min(0, "Cannot be negative."),
});

export const journalSchema = z
  .object({
    entryDate: z.string().min(1, "Entry date is required."),
    type: z.enum(["general", "adjusting", "closing"]),
    reference: z.string().trim().max(100).optional().or(z.literal("")),
    memo: z.string().trim().max(500).optional().or(z.literal("")),
    transactionSeriesId: z.string().optional().or(z.literal("")),
    fundSourceId: z.string().optional().or(z.literal("")),
    items: z.array(journalLine).min(2, "Add at least two lines."),
  })
  .superRefine((value, ctx) => {
    let debit = 0;
    let credit = 0;

    value.items.forEach((line, index) => {
      const hasDebit = line.debit > 0;
      const hasCredit = line.credit > 0;

      if (hasDebit === hasCredit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter an amount in exactly one of debit or credit.",
          path: ["items", index, "debit"],
        });
      }

      debit = Math.round((debit + line.debit) * 100) / 100;
      credit = Math.round((credit + line.credit) * 100) / 100;
    });

    if (debit !== credit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Total debit (${debit.toFixed(2)}) must equal total credit (${credit.toFixed(2)}).`,
        path: ["items"],
      });
    }

    if (debit === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A journal entry cannot be empty.",
        path: ["items"],
      });
    }
  });

export type JournalFormValues = z.infer<typeof journalSchema>;

export const journalLineDefault = {
  accountId: "",
  taxId: "",
  description: "",
  debit: 0,
  credit: 0,
};

export const billFormSchema = z
  .object({
    expenseDate: z.string().min(1, "Expense date is required."),
    expenseName: z.string().trim().min(1, "Expense name is required.").max(250),
    categoryId: z.string().min(1, "Select an expense category."),
    totalAmount: z.number().positive("Amount must be greater than zero."),
    paymentOption: z.enum(billPaymentOptions.map((option) => option.value)),
    amountToPayNow: z.number().min(0, "Payment cannot be negative."),
    paidFromAccountId: z.string().optional().or(z.literal("")),
    vendorId: z.string().optional().or(z.literal("")),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    if (value.paymentOption !== "unpaid" && !value.paidFromAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select the account used for payment.",
        path: ["paidFromAccountId"],
      });
    }
    if (
      value.paymentOption === "full" &&
      value.amountToPayNow !== value.totalAmount
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A full payment must equal the total expense.",
        path: ["amountToPayNow"],
      });
    }
    if (
      value.paymentOption === "partial" &&
      (value.amountToPayNow <= 0 || value.amountToPayNow >= value.totalAmount)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "A partial payment must be greater than zero and less than the total.",
        path: ["amountToPayNow"],
      });
    }
    if (value.paymentOption === "unpaid" && value.amountToPayNow !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "An unpaid expense cannot include a payment.",
        path: ["amountToPayNow"],
      });
    }
  });

export type BillFormValues = z.infer<typeof billFormSchema>;

export const paymentRecordingSchema = z.object({
  paymentDate: z.string().min(1, "Payment date is required."),
  amount: z.number().positive("Payment amount must be greater than zero."),
  paidFromAccountId: z.string().min(1, "Select the account used for payment."),
  reference: z.string().trim().max(100).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type PaymentRecordingFormValues = z.infer<typeof paymentRecordingSchema>;

export const vendorSchema = z.object({
  name: z.string().trim().min(1, "Vendor name is required.").max(180),
  legalName: z.string().trim().max(180).optional().or(z.literal("")),
  tin: z.string().trim().max(80).optional().or(z.literal("")),
  contactPerson: z.string().trim().max(180).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Enter a valid email.")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().max(80).optional().or(z.literal("")),
  address: z.string().trim().max(2000).optional().or(z.literal("")),
  defaultPayableAccountId: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]),
});
export type VendorFormValues = z.infer<typeof vendorSchema>;

export const taxSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  code: z.string().trim().max(40).optional().or(z.literal("")),
  rate: z.number().min(0).max(100),
  status: recordStatus,
});

export type TaxFormValues = z.infer<typeof taxSchema>;

export const fundSourceSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  code: z.string().trim().max(40).optional().or(z.literal("")),
  status: recordStatus,
});

export type FundSourceFormValues = z.infer<typeof fundSourceSchema>;

export const transactionSeriesSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  prefix: z
    .string()
    .trim()
    .min(1, "Prefix is required.")
    .max(20)
    .regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers, or hyphens only."),
  nextNumber: z.number().int().min(1),
  padding: z.number().int().min(1).max(10),
  resetInterval: z.enum(["never", "daily", "monthly", "yearly"]),
  status: recordStatus,
});

export type TransactionSeriesFormValues = z.infer<
  typeof transactionSeriesSchema
>;

export const fiscalYearSchema = z
  .object({
    code: z.string().trim().min(1, "Code is required.").max(20),
    name: z.string().trim().min(1, "Name is required.").max(50),
    startDate: z.string().min(1, "Start date is required."),
    endDate: z.string().min(1, "End date is required."),
    isCurrent: z.boolean(),
  })
  .refine((value) => value.endDate > value.startDate, {
    message: "End date must be after the start date.",
    path: ["endDate"],
  });

export type FiscalYearFormValues = z.infer<typeof fiscalYearSchema>;

export const reverseSchema = z.object({
  reason: z.string().trim().min(3, "Provide a reason.").max(500),
  reversalDate: z.string().optional().or(z.literal("")),
});

export type ReverseFormValues = z.infer<typeof reverseSchema>;
