import { apiClient } from "@/libs/api/apiClient";

import type {
  AccountPayload,
  AccountingEventResource,
  AccountResource,
  AccountStats,
  AccountTreeNode,
  AccountTypeResource,
  AccountingDefaultResource,
  AccountingDefaultsPayload,
  AccountingPeriodResource,
  DetailTypeResource,
  ExpenseCategoryResource,
  ExpensePaymentAccount,
  ExpensePayload,
  ExpensePaymentPayload,
  ExpensePaymentResource,
  ExpenseResource,
  BalanceSheetReport,
  BillsResponse,
  FiscalYearPayload,
  FiscalYearResource,
  FiscalYearUpdatePayload,
  FundSourcePayload,
  FundSourceResource,
  GeneralLedgerReport,
  IncomeExpenseReport,
  IncomeStatementReport,
  CashFlowReport,
  JournalEntryPayload,
  JournalEntryResource,
  ListParams,
  PaginatedResponse,
  ResourceResponse,
  ReverseJournalPayload,
  TaxPayload,
  TaxResource,
  TransactionSeriesPayload,
  TransactionSeriesResource,
  TrialBalanceReport,
  VendorPayload,
  VendorResource,
} from "./types";

const BASE = "/api/accounting";

const query = (params: ListParams = {}): string => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;

    if (Array.isArray(value)) {
      value
        .filter((item) => item !== "")
        .forEach((item) => search.append(`${key}[]`, String(item)));

      return;
    }

    search.set(key, String(value));
  });

  const value = search.toString();

  return value ? `?${value}` : "";
};

const resource = <T>(path: string, init?: Parameters<typeof apiClient>[1]) =>
  apiClient<ResourceResponse<T>>(path, init);

export const accountingApi = {
  bills: {
    list: (params: ListParams = {}) =>
      apiClient<BillsResponse>(`${BASE}/bills${query(params)}`),
    get: (id: string) => resource<ExpenseResource>(`${BASE}/bills/${id}`),
  },
  vendors: {
    list: (params: ListParams = {}) =>
      apiClient<PaginatedResponse<VendorResource>>(
        `${BASE}/vendors${query(params)}`,
      ),
    get: (id: string) => resource<VendorResource>(`${BASE}/vendors/${id}`),
    create: (payload: VendorPayload) =>
      resource<VendorResource>(`${BASE}/vendors`, {
        method: "POST",
        body: payload,
      }),
    update: (id: string, payload: Partial<VendorPayload>) =>
      resource<VendorResource>(`${BASE}/vendors/${id}`, {
        method: "PATCH",
        body: payload,
      }),
    remove: (id: string) =>
      apiClient<void>(`${BASE}/vendors/${id}`, { method: "DELETE" }),
  },
  expenses: {
    categories: () =>
      resource<ExpenseCategoryResource[]>(`${BASE}/expense-categories`),
    paymentAccounts: () =>
      resource<ExpensePaymentAccount[]>(`${BASE}/expense-payment-accounts`),
    payableAccounts: () =>
      resource<AccountResource[]>(`${BASE}/expense-payable-accounts`),
    list: (params: ListParams = {}) =>
      apiClient<PaginatedResponse<ExpenseResource>>(
        `${BASE}/expenses${query(params)}`,
      ),
    get: (id: string) => resource<ExpenseResource>(`${BASE}/expenses/${id}`),
    create: (payload: ExpensePayload) =>
      resource<ExpenseResource>(`${BASE}/expenses`, {
        method: "POST",
        body: payload,
      }),
    update: (id: string, payload: Partial<ExpensePayload>) =>
      resource<ExpenseResource>(`${BASE}/expenses/${id}`, {
        method: "PATCH",
        body: payload,
      }),
    remove: (id: string) =>
      apiClient<void>(`${BASE}/expenses/${id}`, { method: "DELETE" }),
    post: (id: string, initialPayment?: ExpensePaymentPayload | null) =>
      resource<ExpenseResource>(`${BASE}/expenses/${id}/post`, {
        method: "POST",
        body: initialPayment ? { initial_payment: initialPayment } : {},
      }),
    void: (id: string, reason: string) =>
      resource<ExpenseResource>(`${BASE}/expenses/${id}/void`, {
        method: "POST",
        body: { reason },
      }),
    payments: {
      list: (expenseId: string) =>
        resource<ExpensePaymentResource[]>(
          `${BASE}/expenses/${expenseId}/payments`,
        ),
      create: (expenseId: string, payload: ExpensePaymentPayload) =>
        resource<ExpensePaymentResource>(
          `${BASE}/expenses/${expenseId}/payments`,
          { method: "POST", body: payload },
        ),
      post: (expenseId: string, paymentId: string) =>
        resource<ExpensePaymentResource>(
          `${BASE}/expenses/${expenseId}/payments/${paymentId}/post`,
          { method: "POST" },
        ),
      void: (expenseId: string, paymentId: string, reason: string) =>
        resource<ExpensePaymentResource>(
          `${BASE}/expenses/${expenseId}/payments/${paymentId}/void`,
          { method: "POST", body: { reason } },
        ),
    },
    uploadReceipt: (id: string, receipt: File) => {
      const body = new FormData();
      body.append("receipt", receipt);
      return resource<ExpenseResource>(`${BASE}/expenses/${id}/receipt`, {
        method: "POST",
        body,
      });
    },
    removeReceipt: (id: string) =>
      apiClient<void>(`${BASE}/expenses/${id}/receipt`, { method: "DELETE" }),
    uploadDocument: (id: string, document: File) => {
      const body = new FormData();
      body.append("document", document);
      return resource<ExpenseResource>(`${BASE}/expenses/${id}/documents`, {
        method: "POST",
        body,
      });
    },
    removeDocument: (expenseId: string, documentId: string) =>
      apiClient<void>(`${BASE}/expenses/${expenseId}/documents/${documentId}`, {
        method: "DELETE",
      }),
  },
  accounts: {
    list: (params: ListParams = {}) =>
      apiClient<PaginatedResponse<AccountResource>>(
        `${BASE}/accounts${query(params)}`,
      ),
    tree: (params: ListParams = {}) =>
      apiClient<{ data: AccountTreeNode[] }>(
        `${BASE}/accounts${query({ ...params, nested: 1 })}`,
      ),
    stats: () => resource<AccountStats>(`${BASE}/accounts/stats`),
    get: (id: string) => resource<AccountResource>(`${BASE}/accounts/${id}`),
    create: (payload: AccountPayload) =>
      resource<AccountResource>(`${BASE}/accounts`, {
        method: "POST",
        body: payload,
      }),
    update: (id: string, payload: Partial<AccountPayload>) =>
      resource<AccountResource>(`${BASE}/accounts/${id}`, {
        method: "PATCH",
        body: payload,
      }),
    remove: (id: string) =>
      apiClient<void>(`${BASE}/accounts/${id}`, { method: "DELETE" }),
  },
  accountTypes: {
    list: () =>
      apiClient<{ data: AccountTypeResource[] }>(`${BASE}/account-types`),
    detailTypes: (accountTypeId: number) =>
      apiClient<{ data: DetailTypeResource[] }>(
        `${BASE}/account-types/${accountTypeId}/detail-types`,
      ),
  },
  fiscalYears: {
    list: (params: ListParams = {}) =>
      apiClient<PaginatedResponse<FiscalYearResource>>(
        `${BASE}/fiscal-years${query(params)}`,
      ),
    create: (payload: FiscalYearPayload) =>
      resource<FiscalYearResource>(`${BASE}/fiscal-years`, {
        method: "POST",
        body: payload,
      }),
    setCurrent: (id: string) =>
      resource<FiscalYearResource>(`${BASE}/fiscal-years/${id}/current`, {
        method: "PATCH",
      }),
    update: (id: string, payload: FiscalYearUpdatePayload) =>
      resource<FiscalYearResource>(`${BASE}/fiscal-years/${id}`, {
        method: "PATCH",
        body: payload,
      }),
    remove: (id: string) =>
      apiClient<void>(`${BASE}/fiscal-years/${id}`, { method: "DELETE" }),
  },
  periods: {
    list: (params: ListParams = {}) =>
      apiClient<{ data: AccountingPeriodResource[] }>(
        `${BASE}/periods${query(params)}`,
      ),
    updateStatus: (id: string, status: string) =>
      resource<AccountingPeriodResource>(`${BASE}/periods/${id}/status`, {
        method: "PATCH",
        body: { status },
      }),
  },
  taxes: {
    list: (params: ListParams = {}) =>
      apiClient<PaginatedResponse<TaxResource>>(
        `${BASE}/taxes${query(params)}`,
      ),
    create: (payload: TaxPayload) =>
      resource<TaxResource>(`${BASE}/taxes`, { method: "POST", body: payload }),
    update: (id: string, payload: Partial<TaxPayload>) =>
      resource<TaxResource>(`${BASE}/taxes/${id}`, {
        method: "PATCH",
        body: payload,
      }),
    remove: (id: string) =>
      apiClient<void>(`${BASE}/taxes/${id}`, { method: "DELETE" }),
  },
  fundSources: {
    list: (params: ListParams = {}) =>
      apiClient<PaginatedResponse<FundSourceResource>>(
        `${BASE}/fund-sources${query(params)}`,
      ),
    create: (payload: FundSourcePayload) =>
      resource<FundSourceResource>(`${BASE}/fund-sources`, {
        method: "POST",
        body: payload,
      }),
    update: (id: string, payload: Partial<FundSourcePayload>) =>
      resource<FundSourceResource>(`${BASE}/fund-sources/${id}`, {
        method: "PATCH",
        body: payload,
      }),
    remove: (id: string) =>
      apiClient<void>(`${BASE}/fund-sources/${id}`, { method: "DELETE" }),
  },
  transactionSeries: {
    list: (params: ListParams = {}) =>
      apiClient<PaginatedResponse<TransactionSeriesResource>>(
        `${BASE}/transaction-series${query(params)}`,
      ),
    create: (payload: TransactionSeriesPayload) =>
      resource<TransactionSeriesResource>(`${BASE}/transaction-series`, {
        method: "POST",
        body: payload,
      }),
    update: (id: string, payload: Partial<TransactionSeriesPayload>) =>
      resource<TransactionSeriesResource>(`${BASE}/transaction-series/${id}`, {
        method: "PATCH",
        body: payload,
      }),
    remove: (id: string) =>
      apiClient<void>(`${BASE}/transaction-series/${id}`, { method: "DELETE" }),
  },
  journals: {
    list: (params: ListParams = {}) =>
      apiClient<PaginatedResponse<JournalEntryResource>>(
        `${BASE}/journals${query(params)}`,
      ),
    get: (id: string) =>
      resource<JournalEntryResource>(`${BASE}/journals/${id}`),
    create: (payload: JournalEntryPayload) =>
      resource<JournalEntryResource>(`${BASE}/journals`, {
        method: "POST",
        body: payload,
      }),
    update: (id: string, payload: JournalEntryPayload) =>
      resource<JournalEntryResource>(`${BASE}/journals/${id}`, {
        method: "PATCH",
        body: payload,
      }),
    remove: (id: string) =>
      apiClient<void>(`${BASE}/journals/${id}`, { method: "DELETE" }),
    post: (id: string) =>
      resource<JournalEntryResource>(`${BASE}/journals/${id}/post`, {
        method: "POST",
      }),
    reverse: (id: string, payload: ReverseJournalPayload) =>
      resource<JournalEntryResource>(`${BASE}/journals/${id}/reverse`, {
        method: "POST",
        body: payload,
      }),
    void: (id: string, reason?: string | null) =>
      resource<JournalEntryResource>(`${BASE}/journals/${id}/void`, {
        method: "POST",
        body: reason ? { reason } : {},
      }),
  },
  events: {
    list: (params: ListParams = {}) =>
      apiClient<PaginatedResponse<AccountingEventResource>>(
        `${BASE}/events${query(params)}`,
      ),
    get: (id: string) =>
      resource<AccountingEventResource>(`${BASE}/events/${id}`),
    retry: (id: string) =>
      resource<AccountingEventResource>(`${BASE}/events/${id}/retry`, {
        method: "POST",
      }),
  },
  defaults: {
    get: () => resource<AccountingDefaultResource>(`${BASE}/settings/defaults`),
    update: (payload: AccountingDefaultsPayload) =>
      resource<AccountingDefaultResource>(`${BASE}/settings/defaults`, {
        method: "PATCH",
        body: payload,
      }),
  },
  reports: {
    trialBalance: (params: ListParams = {}) =>
      resource<TrialBalanceReport>(
        `${BASE}/reports/trial-balance${query(params)}`,
      ),
    incomeStatement: (params: ListParams = {}) =>
      resource<IncomeStatementReport>(
        `${BASE}/reports/income-statement${query(params)}`,
      ),
    incomeExpenses: (params: ListParams = {}) =>
      resource<IncomeExpenseReport>(
        `${BASE}/reports/income-expenses${query(params)}`,
      ),
    cashFlow: (params: ListParams = {}) =>
      resource<CashFlowReport>(`${BASE}/reports/cash-flow${query(params)}`),
    balanceSheet: (params: ListParams = {}) =>
      resource<BalanceSheetReport>(
        `${BASE}/reports/balance-sheet${query(params)}`,
      ),
    generalLedger: (params: ListParams = {}) =>
      resource<GeneralLedgerReport>(
        `${BASE}/reports/general-ledger${query(params)}`,
      ),
    exportUrl: (report: string, params: ListParams = {}) =>
      `${BASE}/reports/${report}${query(params)}`,
  },
};
