export const billPaymentOptions = [
  { value: "full", label: "Pay in Full" },
  { value: "partial", label: "Pay Partially" },
  { value: "unpaid", label: "Record as Unpaid" },
] as const;

export type ExpensePaymentOption = (typeof billPaymentOptions)[number]["value"];
