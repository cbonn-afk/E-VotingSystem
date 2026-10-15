import type { IncomeStatementTransaction } from "../api/types";

export type TransactionTypeMeta = {
  label: string;
  icon: string;
};

// Keyed by `dimensions.event_type` (or a synthetic key for sources that don't
// carry one, e.g. manually-posted expense lines — see resolveKind below).
// Covers every Modules\Accounting\Enums\AccountingEventType case plus the
// two expense sub-kinds, so a label always exists.
const TYPE_META: Record<string, TransactionTypeMeta> = {
  "soa.issued": { label: "Sale", icon: "bx-cart" },
  "soa.voided": { label: "Sale Voided", icon: "bx-x-circle" },
  "payment.recorded": { label: "Payment Received", icon: "bx-money" },
  "payment.voided": { label: "Payment Voided", icon: "bx-x-circle" },
  "payment.cleared": { label: "Payment Cleared", icon: "bx-check-double" },
  "payment.clearing_reversed": {
    label: "Payment Clearing Reversed",
    icon: "bx-x-circle",
  },
  "expense.recognition": { label: "Expense", icon: "bx-receipt" },
  "expense.payment": { label: "Expense Payment", icon: "bx-credit-card" },
  "inventory.restocked": { label: "Inventory Restock", icon: "bx-package" },
  "inventory.adjusted": { label: "Inventory Adjustment", icon: "bx-slider" },
  "bom.inventory.consumed": {
    label: "Inventory Used (COGS)",
    icon: "bx-package",
  },
  "bom.inventory.consumption_reversed": {
    label: "Inventory Use Reversed",
    icon: "bx-x-circle",
  },
  "payroll.released": { label: "Payroll", icon: "bx-money-withdraw" },
  "payroll.voided": { label: "Payroll Voided", icon: "bx-x-circle" },
  "advance.disbursed": { label: "Employee Advance", icon: "bx-transfer" },
  "advance.disbursement_reversed": {
    label: "Advance Reversed",
    icon: "bx-x-circle",
  },
  "partner.earning.recognized": {
    label: "Partner Commission",
    icon: "bx-group",
  },
  "partner.earning.reversed": {
    label: "Commission Reversed",
    icon: "bx-x-circle",
  },
  "partner.payout.paid": { label: "Partner Payout", icon: "bx-wallet" },
  manual: { label: "Manual Entry", icon: "bx-edit-alt" },
};

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value : null;

/** Resolves the dimension key driving the type label, filling in the gap for
 * expense lines (which predate `event_type` and instead carry `line_role`). */
const resolveKind = (transaction: IncomeStatementTransaction): string => {
  const dims = transaction.dimensions;
  const eventType = asString(dims.event_type);
  if (eventType) return eventType;

  if (asString(dims.source_type) === "expense") {
    const role = asString(dims.line_role) ?? "";
    return role.includes("payment") ? "expense.payment" : "expense.recognition";
  }

  return "manual";
};

export const getTransactionTypeMeta = (
  transaction: IncomeStatementTransaction,
): TransactionTypeMeta =>
  TYPE_META[resolveKind(transaction)] ?? TYPE_META.manual;

/** The customer/vendor/partner/employee this transaction is with, if any. */
export const getTransactionParty = (
  transaction: IncomeStatementTransaction,
): string | null => {
  const dims = transaction.dimensions;

  return (
    asString(dims.customer_name) ??
    asString(dims.vendor_name) ??
    asString(dims.partner_name) ??
    asString(dims.employee_name) ??
    null
  );
};

/** The human document reference (invoice/bill/payroll/payout number, …). */
export const getTransactionDocument = (
  transaction: IncomeStatementTransaction,
): string => {
  const dims = transaction.dimensions;

  return (
    asString(dims.invoice_no) ??
    asString(dims.soa_no) ??
    asString(dims.bill_reference) ??
    asString(dims.payout_no) ??
    asString(dims.payroll_no) ??
    asString(dims.order_no) ??
    transaction.entry_no ??
    transaction.memo ??
    "Journal entry"
  );
};

export type TransactionLinks = {
  /** Best click-through for a non-technical reader — the source document. */
  primary: string | null;
  /** Always available: the raw journal entry, for anyone who wants the ledger view. */
  journal: string;
};

export const getTransactionLinks = (
  transaction: IncomeStatementTransaction,
): TransactionLinks => {
  const dims = transaction.dimensions;
  const journal = `/accounting/journals/${transaction.journal_entry_id}`;
  const kind = resolveKind(transaction);

  const soaId =
    asString(dims.soa_id) ??
    (transaction.source_type === "soa" ? transaction.source_id : null);
  if (soaId) return { primary: `/ordering/invoices/${soaId}/edit`, journal };

  const expenseId = asString(dims.expense_id);
  if (expenseId)
    return { primary: `/accounting/expenses/${expenseId}`, journal };

  if (kind === "partner.payout.paid") {
    return { primary: "/partners/payouts", journal };
  }
  if (
    kind === "partner.earning.recognized" ||
    kind === "partner.earning.reversed" ||
    transaction.source_module === "partners"
  ) {
    return { primary: "/partners/earnings", journal };
  }

  if (
    transaction.source_type === "payroll_run" &&
    asString(transaction.source_id)
  ) {
    return {
      primary: `/employees/payrolls/${transaction.source_id}/edit`,
      journal,
    };
  }

  if (transaction.source_module === "inventory") {
    return { primary: "/inventory/items", journal };
  }

  return { primary: null, journal };
};
