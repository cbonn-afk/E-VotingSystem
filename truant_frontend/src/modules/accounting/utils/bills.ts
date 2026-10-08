import type { ExpenseResource } from "../api/types";

export const getBillPayeeName = (
  bill: Pick<ExpenseResource, "vendor">,
): string => bill.vendor?.name ?? "—";

export const paymentAmountError = (
  amount: number,
  outstanding: number,
): string | null => {
  if (amount <= 0) return "Payment amount must be greater than zero.";
  if (amount > outstanding)
    return "Payment cannot exceed the outstanding balance.";
  return null;
};

export const canRecordBillPayment = (
  bill: Pick<ExpenseResource, "status" | "outstandingAmount">,
  hasPermission: boolean,
): boolean =>
  hasPermission && bill.status === "posted" && bill.outstandingAmount > 0;

export const billListState = (
  loading: boolean,
  error: boolean,
  count: number,
) => (loading ? "loading" : error ? "error" : count === 0 ? "empty" : "ready");
