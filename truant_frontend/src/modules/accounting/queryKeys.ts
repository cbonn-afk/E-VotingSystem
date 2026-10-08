import type { ListParams } from "./api/types";

export const accountingQueryKeys = {
  all: ["accounting"] as const,
  accounts: {
    all: () => [...accountingQueryKeys.all, "accounts"] as const,
    list: (params: ListParams = {}) =>
      [...accountingQueryKeys.accounts.all(), "list", params] as const,
    tree: (params: ListParams = {}) =>
      [...accountingQueryKeys.accounts.all(), "tree", params] as const,
    stats: () => [...accountingQueryKeys.accounts.all(), "stats"] as const,
    detail: (id: string) =>
      [...accountingQueryKeys.accounts.all(), "detail", id] as const,
  },
  accountTypes: () => [...accountingQueryKeys.all, "account-types"] as const,
  expenses: {
    all: () => [...accountingQueryKeys.all, "expenses"] as const,
    categories: () =>
      [...accountingQueryKeys.expenses.all(), "categories"] as const,
    paymentAccounts: () =>
      [...accountingQueryKeys.expenses.all(), "payment-accounts"] as const,
    payableAccounts: () =>
      [...accountingQueryKeys.expenses.all(), "payable-accounts"] as const,
    list: (params: ListParams = {}) =>
      [...accountingQueryKeys.expenses.all(), "list", params] as const,
    detail: (id: string) =>
      [...accountingQueryKeys.expenses.all(), "detail", id] as const,
    payments: (id: string) =>
      [...accountingQueryKeys.expenses.detail(id), "payments"] as const,
  },
  bills: {
    all: () => [...accountingQueryKeys.all, "bills"] as const,
    list: (params: ListParams = {}) =>
      [...accountingQueryKeys.bills.all(), "list", params] as const,
    detail: (id: string) =>
      [...accountingQueryKeys.bills.all(), "detail", id] as const,
  },
  vendors: {
    all: () => [...accountingQueryKeys.all, "vendors"] as const,
    list: (params: ListParams = {}) =>
      [...accountingQueryKeys.vendors.all(), "list", params] as const,
    detail: (id: string) =>
      [...accountingQueryKeys.vendors.all(), "detail", id] as const,
  },
  detailTypes: (accountTypeId: number | null) =>
    [...accountingQueryKeys.all, "detail-types", accountTypeId] as const,
  fiscalYears: {
    all: () => [...accountingQueryKeys.all, "fiscal-years"] as const,
    list: (params: ListParams = {}) =>
      [...accountingQueryKeys.fiscalYears.all(), "list", params] as const,
  },
  periods: {
    all: () => [...accountingQueryKeys.all, "periods"] as const,
    list: (params: ListParams = {}) =>
      [...accountingQueryKeys.periods.all(), "list", params] as const,
  },
  taxes: {
    all: () => [...accountingQueryKeys.all, "taxes"] as const,
    list: (params: ListParams = {}) =>
      [...accountingQueryKeys.taxes.all(), "list", params] as const,
  },
  fundSources: {
    all: () => [...accountingQueryKeys.all, "fund-sources"] as const,
    list: (params: ListParams = {}) =>
      [...accountingQueryKeys.fundSources.all(), "list", params] as const,
  },
  transactionSeries: {
    all: () => [...accountingQueryKeys.all, "transaction-series"] as const,
    list: (params: ListParams = {}) =>
      [...accountingQueryKeys.transactionSeries.all(), "list", params] as const,
  },
  journals: {
    all: () => [...accountingQueryKeys.all, "journals"] as const,
    list: (params: ListParams = {}) =>
      [...accountingQueryKeys.journals.all(), "list", params] as const,
    detail: (id: string) =>
      [...accountingQueryKeys.journals.all(), "detail", id] as const,
  },
  events: {
    all: () => [...accountingQueryKeys.all, "events"] as const,
    list: (params: ListParams = {}) =>
      [...accountingQueryKeys.events.all(), "list", params] as const,
    detail: (id: string) =>
      [...accountingQueryKeys.events.all(), "detail", id] as const,
  },
  defaults: () => [...accountingQueryKeys.all, "defaults"] as const,
  reports: {
    all: () => [...accountingQueryKeys.all, "reports"] as const,
    trialBalance: (params: ListParams = {}) =>
      [...accountingQueryKeys.reports.all(), "trial-balance", params] as const,
    incomeStatement: (params: ListParams = {}) =>
      [
        ...accountingQueryKeys.reports.all(),
        "income-statement",
        params,
      ] as const,
    incomeExpenses: (params: ListParams = {}) =>
      [
        ...accountingQueryKeys.reports.all(),
        "income-expenses",
        params,
      ] as const,
    cashFlow: (params: ListParams = {}) =>
      [...accountingQueryKeys.reports.all(), "cash-flow", params] as const,
    balanceSheet: (params: ListParams = {}) =>
      [...accountingQueryKeys.reports.all(), "balance-sheet", params] as const,
    generalLedger: (params: ListParams = {}) =>
      [...accountingQueryKeys.reports.all(), "general-ledger", params] as const,
  },
};
