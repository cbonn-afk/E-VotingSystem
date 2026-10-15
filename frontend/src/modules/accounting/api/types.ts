// Shared API envelope types (Laravel resources / pagination).
export type ResourceResponse<T> = { data: T };

export type PaginationLinks = {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
};

export type PaginationMeta = {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  links: PaginationLinks;
  meta: PaginationMeta;
};

export type ListParams = Record<
  string,
  string | number | boolean | Array<string | number | boolean> | undefined
>;

// ─── Enums (string unions mirroring backend enums) ──────────────────────────
export type AccountTypeValue =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense";
export type NormalBalance = "debit" | "credit";
export type RecordStatus = "active" | "inactive";
export type PeriodStatus = "open" | "closed" | "locked";
export type FiscalYearStatus = "open" | "closed";
export type JournalEntryStatus = "draft" | "posted" | "void" | "reversed";
export type JournalEntryType = "general" | "adjusting" | "closing" | "reversal";
export type ResetInterval = "never" | "daily" | "monthly" | "yearly";
export type AccountingEventStatus =
  | "pending"
  | "processing"
  | "processed"
  | "failed";
export type AccountingEventType =
  | "soa.issued"
  | "payment.recorded"
  | "payment.voided"
  | "soa.voided"
  | "inventory.restocked"
  | "inventory.adjusted"
  | "bom.inventory.consumed"
  | "bom.inventory.consumption_reversed"
  | "payroll.released"
  | "payroll.voided"
  | "advance.disbursed"
  | "advance.disbursement_reversed";

// ─── Resources ──────────────────────────────────────────────────────────────
export type AccountTypeResource = {
  id: number;
  code: string;
  name: string;
  category: AccountTypeValue;
  normalBalance: NormalBalance;
  isActive: boolean;
  detailTypes?: DetailTypeResource[];
};

export type DetailTypeResource = {
  id: number;
  accountTypeId: number;
  code: string;
  name: string;
  isActive: boolean;
};

export type AccountResource = {
  id: string;
  code: string;
  name: string;
  type: AccountTypeValue;
  normalBalance: NormalBalance;
  parentId: string | null;
  accountTypeId: number | null;
  detailTypeId: number | null;
  isPosting: boolean;
  isContra: boolean;
  isSystem: boolean;
  status: RecordStatus;
  description: string | null;
  // Populated by the tree endpoint; in list mode `hasChildren` mirrors the
  // children count and `level` is null.
  level?: number | null;
  hasChildren?: boolean | null;
  children?: AccountTreeNode[];
  parent?: AccountResource | null;
  accountType?: AccountTypeResource | null;
  detailType?: DetailTypeResource | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AccountTreeNode = AccountResource & {
  children: AccountTreeNode[];
};

export type AccountStats = {
  total: number;
  active: number;
  inactive: number;
  posting: number;
  nonPosting: number;
  byType: Record<AccountTypeValue, number>;
};

export type AccountingPeriodResource = {
  id: string;
  fiscalYearId: string;
  periodNumber: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  status: PeriodStatus;
  closedAt: string | null;
};

export type FiscalYearResource = {
  id: string;
  code: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  status: FiscalYearStatus;
  isCurrent: boolean;
  closedAt: string | null;
  periods?: AccountingPeriodResource[];
  createdAt: string | null;
  updatedAt: string | null;
};

export type TaxResource = {
  id: string;
  name: string;
  code: string | null;
  rate: number;
  status: RecordStatus;
  isUsed: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type FundSourceResource = {
  id: string;
  name: string;
  code: string | null;
  status: RecordStatus;
  isUsed: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type TransactionSeriesResource = {
  id: string;
  name: string;
  prefix: string;
  nextNumber: number;
  padding: number;
  resetInterval: ResetInterval;
  status: RecordStatus;
  isUsed: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type JournalItemResource = {
  id: string;
  journalEntryId: string;
  accountId: string;
  taxId: string | null;
  lineNo: number;
  description: string | null;
  debit: number;
  credit: number;
  account?: AccountResource | null;
  tax?: TaxResource | null;
};

export type JournalEntryResource = {
  id: string;
  entryNo: string | null;
  entryDate: string | null;
  type: JournalEntryType;
  status: JournalEntryStatus;
  reference: string | null;
  memo: string | null;
  transactionSeriesId: string | null;
  fundSourceId: string | null;
  accountingPeriodId: string | null;
  totalDebit: number;
  totalCredit: number;
  postedAt: string | null;
  postedById: number | null;
  voidedAt: string | null;
  voidReason: string | null;
  reversesJournalEntryId: string | null;
  reversedByJournalEntryId: string | null;
  sourceModule: string | null;
  sourceType: string | null;
  sourceId: string | null;
  isEditable: boolean;
  items?: JournalItemResource[];
  fundSource?: FundSourceResource | null;
  transactionSeries?: TransactionSeriesResource | null;
  createdBy?: string | null;
  postedBy?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AccountingEventResource = {
  id: string;
  idempotencyKey: string;
  eventType: AccountingEventType;
  sourceModule: string | null;
  sourceType: string | null;
  sourceId: string | null;
  eventDate: string | null;
  amount: number | null;
  actorId: number | null;
  payload: Record<string, unknown> | null;
  status: AccountingEventStatus;
  journalEntryId: string | null;
  journalEntry?: JournalEntryResource | null;
  processedAt: string | null;
  errorMessage: string | null;
  attempts: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AccountingDefaultResource = {
  accountsReceivableAccountId: string | null;
  tradeReceivablesAccountId: string | null;
  salesRevenueAccountId: string | null;
  cashSalesRevenueAccountId: string | null;
  chargeSalesRevenueAccountId: string | null;
  salesDiscountAccountId: string | null;
  cashAccountId: string | null;
  cashOnHandAccountId: string | null;
  bankAccountId: string | null;
  ewalletAccountId: string | null;
  cardClearingAccountId: string | null;
  checksReceivableAccountId: string | null;
  salesTaxPayableAccountId: string | null;
  inventoryAssetAccountId: string | null;
  inventoryRestockClearingAccountId: string | null;
  cogsAccountId: string | null;
  inventoryAdjustmentExpenseAccountId: string | null;
  partnerShareExpenseAccountId: string | null;
  partnerPayableAccountId: string | null;
  defaultTransactionSeriesId: string | null;
  defaultFundSourceId: string | null;
  updatedAt: string | null;
};

export type ExpenseLifecycleStatus = "draft" | "posted" | "void";
export type ExpensePaymentStatus = "unpaid" | "partially_paid" | "paid";

// Cash & bank account an expense can be paid from, with its current ledger balance.
export type ExpensePaymentAccount = {
  id: string;
  code: string;
  name: string;
  currentBalance: number;
};

export type ExpenseCategoryResource = {
  id: string;
  slug: string;
  label: string;
  active: boolean;
  requiresVendor: boolean;
  expenseAccount: Pick<AccountResource, "id" | "code" | "name">;
  defaultPayableAccount: Pick<AccountResource, "id" | "code" | "name">;
};

export type ExpenseDocumentResource = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  previewUrl: string;
  createdAt: string | null;
};

export type ExpenseReceiptResource = ExpenseDocumentResource;

export type ExpensePaymentResource = {
  id: string;
  expenseId: string;
  paymentDate: string;
  amount: number;
  paidFromAccount: AccountResource;
  reference: string | null;
  notes: string | null;
  status: ExpenseLifecycleStatus;
  journalEntryId: string | null;
  postedAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ExpenseResource = {
  id: string;
  billReference: string;
  expenseDate: string;
  expenseName: string;
  category: ExpenseCategoryResource;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentStatus: ExpensePaymentStatus;
  status: ExpenseLifecycleStatus;
  payableAccount: AccountResource;
  vendorId: string | null;
  vendor?: VendorResource | null;
  notes: string | null;
  receiptNumber: string | null;
  receipt: ExpenseReceiptResource | null;
  documents: ExpenseDocumentResource[];
  recognitionJournalEntryId: string | null;
  payments?: ExpensePaymentResource[];
  postedAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type BillsSummary = {
  totalOutstanding: number;
  unpaidTotal: number;
  partiallyPaidTotal: number;
  openBills: number;
};

export type BillsResponse = PaginatedResponse<ExpenseResource> & {
  summary: BillsSummary;
};

export type VendorResource = {
  id: string;
  vendorNo: string;
  name: string;
  legalName: string | null;
  tin: string | null;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  defaultPayableAccount: AccountResource | null;
  notes: string | null;
  status: RecordStatus;
  openBills: number;
  totalOutstanding: number;
  totalPaid: number;
  canDelete: boolean;
  bills?: ExpenseResource[];
  paymentHistory?: ExpensePaymentResource[];
  createdAt: string | null;
  updatedAt: string | null;
};

// ─── Report payloads (decimal strings from backend) ─────────────────────────
export type TrialBalanceRow = {
  account_id: string;
  code: string;
  name: string;
  type: AccountTypeValue;
  normal_balance: NormalBalance;
  debit: string;
  credit: string;
};

export type TrialBalanceReport = {
  as_of: string;
  rows: TrialBalanceRow[];
  total_debit: string;
  total_credit: string;
  balanced: boolean;
};

export type StatementLine = {
  account_id: string | null;
  code: string | null;
  name: string;
  amount: string;
  // Present only when a comparison range was requested.
  previous_amount?: string;
  parent_account_id?: string | null;
  parent_code?: string | null;
  parent_name?: string | null;
  transactions?: IncomeStatementTransaction[];
};

export type IncomeStatementTransaction = {
  journal_entry_id: string;
  entry_no: string | null;
  entry_date: string;
  memo: string | null;
  description: string | null;
  debit: string;
  credit: string;
  amount: string;
  source_module: string | null;
  source_type: string | null;
  source_id: string | null;
  dimensions: Record<string, string | number | boolean>;
};

export type IncomeStatementHierarchyNode = {
  account_id: string;
  code: string;
  name: string;
  amount: string;
  own_amount: string;
  // Present only when comparing: the same account's comparison-period total.
  previous_amount?: string;
  is_posting: boolean;
  transactions: IncomeStatementTransaction[];
  children: IncomeStatementHierarchyNode[];
};

// Summary for the explicitly selected comparison range.
export type IncomeStatementComparison = {
  from: string;
  to: string;
  total_revenue: string;
  total_expenses: string;
  net_income: string;
};

export type IncomeStatementReport = {
  from: string;
  to: string;
  revenue: StatementLine[];
  expenses: StatementLine[];
  revenue_hierarchy: IncomeStatementHierarchyNode[];
  expense_hierarchy: IncomeStatementHierarchyNode[];
  total_revenue: string;
  total_expenses: string;
  net_income: string;
  comparison?: IncomeStatementComparison | null;
};

export type IncomeExpensePaymentStatus = "paid" | "partially_paid" | "unpaid";

export type IncomeExpenseIncomeRow = {
  id: string;
  date: string;
  due_date: string;
  reference: string;
  order_id: string;
  order_no: string | null;
  customer: string;
  sales_type: string;
  gross_amount: string;
  expense_amount?: string | null;
  net_sales_amount?: string | null;
  bom_status?: "Draft" | "Saved" | "Voided" | null;
  paid_amount: string;
  balance_amount: string;
  payment_status: IncomeExpensePaymentStatus;
};

export type IncomeExpenseExpenseRow = {
  id: string;
  date: string;
  due_date: string | null;
  payment_date: string | null;
  reference: string;
  name: string;
  category: string;
  payee: string | null;
  total_amount: string;
  paid_amount: string;
  balance_amount: string;
  payment_status: IncomeExpensePaymentStatus;
  is_bill: boolean;
};

export type IncomeExpensePayrollRow = {
  id: string;
  date: string;
  reference: string;
  payroll_type: "employee" | "tailor";
  frequency: string;
  period_start: string;
  period_end: string;
  released_at: string | null;
  gross_amount: string;
  deduction_amount: string;
  net_amount: string;
  expense_total: string;
  status: "Released";
  employees: IncomeExpensePayrollEmployee[];
};

export type IncomeExpensePayrollEmployee = {
  id: string;
  employee_name: string;
  position: string | null;
  gross_amount: string;
  deduction_amount: string;
  net_amount: string;
  employer_benefits: IncomeExpensePayrollBenefitBreakdown;
};

export type IncomeExpensePayrollBenefitBreakdown = {
  sss: string;
  philhealth: string;
  pagibig: string;
  total: string;
};

export type IncomeExpenseReportSummary = {
  gross_sales: string;
  collected_sales: string;
  accounts_receivable: string;
  cogs: string;
  bills: string;
  payroll: string;
  expenses: string;
  total_expenses: string;
  net_sales: string;
};

export type IncomeExpenseReport = {
  from: string;
  to: string;
  income: IncomeExpenseIncomeRow[];
  bills: IncomeExpenseExpenseRow[];
  payroll: IncomeExpensePayrollRow[];
  expenses: IncomeExpenseExpenseRow[];
  summary: IncomeExpenseReportSummary;
  filters: {
    section: "all" | "income" | "bills" | "payroll" | "expenses";
    payment_status: "all" | IncomeExpensePaymentStatus;
    search: string | null;
  };
};

// Summary for the explicitly selected comparison range.
export type CashFlowComparison = {
  from: string;
  to: string;
  beginning_cash: string;
  ending_cash: string;
  net_operating: string;
  net_investing: string;
  net_financing: string;
  net_change: string;
};

export type CashFlowReport = {
  from: string;
  to: string;
  beginning_cash: string;
  ending_cash: string;
  operating: StatementLine[];
  investing: StatementLine[];
  financing: StatementLine[];
  net_operating: string;
  net_investing: string;
  net_financing: string;
  net_change: string;
  reconciled: boolean;
  comparison?: CashFlowComparison | null;
};

export type BalanceSheetReport = {
  as_of: string;
  assets: StatementLine[];
  liabilities: StatementLine[];
  equity: StatementLine[];
  total_assets: string;
  total_liabilities: string;
  total_equity: string;
  net_income: string;
  balanced: boolean;
};

export type GeneralLedgerTransaction = {
  journal_entry_id: string;
  entry_no: string | null;
  entry_date: string;
  memo: string | null;
  description: string | null;
  debit: string;
  credit: string;
  balance: string;
};

export type GeneralLedgerAccount = {
  account_id: string;
  code: string;
  name: string;
  type: AccountTypeValue;
  normal_balance: NormalBalance;
  opening_balance: string;
  closing_balance: string;
  transactions: GeneralLedgerTransaction[];
};

export type GeneralLedgerReport = {
  from: string | null;
  to: string;
  accounts: GeneralLedgerAccount[];
};

// ─── Request payloads (snake_case — backend FormRequests) ────────────────────
export type AccountPayload = {
  code: string;
  name: string;
  type: AccountTypeValue;
  parent_id?: string | null;
  account_type_id?: number | null;
  detail_type_id?: number | null;
  is_posting?: boolean;
  is_contra?: boolean;
  status?: RecordStatus;
  description?: string | null;
};

export type JournalLinePayload = {
  account_id: string;
  tax_id?: string | null;
  description?: string | null;
  debit?: number;
  credit?: number;
};

export type JournalEntryPayload = {
  entry_date: string;
  type?: JournalEntryType;
  reference?: string | null;
  memo?: string | null;
  transaction_series_id?: string | null;
  fund_source_id?: string | null;
  items: JournalLinePayload[];
};

export type ExpensePaymentPayload = {
  payment_date: string;
  amount: number;
  paid_from_account_id: string;
  reference?: string | null;
  notes?: string | null;
  post_now?: boolean;
};

export type ExpensePayload = {
  expense_date: string;
  expense_name: string;
  expense_category_id: string;
  total_amount: number;
  vendor_id: string | null;
  notes?: string | null;
  receipt_number?: string | null;
  post_now?: boolean;
  initial_payment?: ExpensePaymentPayload | null;
};

export type VendorPayload = {
  name: string;
  legal_name?: string | null;
  tin?: string | null;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  default_payable_account_id?: string | null;
  notes?: string | null;
  status?: RecordStatus;
};

export type ReverseJournalPayload = {
  reason: string;
  reversal_date?: string | null;
};

export type FiscalYearPayload = {
  code: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current?: boolean;
};

export type FiscalYearUpdatePayload = {
  code?: string;
  name?: string;
  status?: FiscalYearStatus;
};

export type TaxPayload = {
  name: string;
  code?: string | null;
  rate: number;
  status?: RecordStatus;
};

export type FundSourcePayload = {
  name: string;
  code?: string | null;
  status?: RecordStatus;
};

export type TransactionSeriesPayload = {
  name: string;
  prefix: string;
  next_number?: number;
  padding?: number;
  reset_interval?: ResetInterval;
  status?: RecordStatus;
};

export type AccountingDefaultsPayload = Partial<{
  accounts_receivable_account_id: string | null;
  trade_receivables_account_id: string | null;
  sales_revenue_account_id: string | null;
  cash_sales_revenue_account_id: string | null;
  charge_sales_revenue_account_id: string | null;
  sales_discount_account_id: string | null;
  cash_account_id: string | null;
  cash_on_hand_account_id: string | null;
  bank_account_id: string | null;
  ewallet_account_id: string | null;
  card_clearing_account_id: string | null;
  checks_receivable_account_id: string | null;
  sales_tax_payable_account_id: string | null;
  inventory_asset_account_id: string | null;
  inventory_restock_clearing_account_id: string | null;
  cogs_account_id: string | null;
  inventory_adjustment_expense_account_id: string | null;
  partner_share_expense_account_id: string | null;
  partner_payable_account_id: string | null;
  default_transaction_series_id: string | null;
  default_fund_source_id: string | null;
}>;
