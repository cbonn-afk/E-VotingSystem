// Type Imports
import type { AccountingNavigationItem } from "../types";

export type AccountingNavigationGroup = {
  /** Plain-language heading shown above the group in the sidebar. */
  label: string;
  items: AccountingNavigationItem[];
};

/**
 * Sidebar grouped by accounting function — daily books, setup, and reports —
 * so the long list reads by purpose. Empty groups are hidden automatically.
 */
export const accountingNavigation: AccountingNavigationGroup[] = [
  {
    label: "Workspace",
    items: [{ label: "Overview", href: "/accounting", icon: "bx-home-circle" }],
  },
  {
    label: "Transactions",
    items: [
      {
        label: "Expenses",
        href: "/accounting/expenses",
        icon: "bx-receipt",
        permission: "accounting.expenses.view",
      },
      {
        label: "Vendors",
        href: "/accounting/vendors",
        icon: "bx-building",
        permission: "accounting.vendors.view",
      },
      {
        label: "Journal Entries",
        href: "/accounting/journals",
        icon: "bx-book",
        permission: "accounting.journals.view",
      },
    ],
  },
  {
    label: "Books",
    items: [
      {
        label: "Chart of Accounts",
        href: "/accounting/accounts",
        icon: "bx-list-ul",
        permission: "accounting.accounts.view",
      },
      {
        label: "Periods",
        href: "/accounting/periods",
        icon: "bx-calendar",
        permission: "accounting.periods.view",
      },
    ],
  },
  {
    label: "Reports",
    items: [
      {
        label: "Trial Balance",
        href: "/accounting/reports/trial-balance",
        icon: "bx-bar-chart-alt",
        permission: "accounting.reports.view",
      },
      {
        label: "Income Statement",
        href: "/accounting/reports/income-statement",
        icon: "bx-trending-up",
        permission: "accounting.reports.view",
      },
      {
        label: "Operating Summary",
        href: "/accounting/reports/income-expenses",
        icon: "bx-receipt",
        permission: "accounting.reports.view",
      },
      {
        label: "Cash Flow",
        href: "/accounting/reports/cash-flow",
        icon: "bx-transfer-alt",
        permission: "accounting.reports.view",
      },
      {
        label: "Balance Sheet",
        href: "/accounting/reports/balance-sheet",
        icon: "bx-spreadsheet",
        permission: "accounting.reports.view",
      },
      {
        label: "General Ledger",
        href: "/accounting/reports/general-ledger",
        icon: "bx-book-open",
        permission: "accounting.reports.view",
      },
    ],
  },
  {
    label: "Setup",
    items: [
      {
        label: "Taxes",
        href: "/accounting/taxes",
        icon: "bx-receipt",
        permission: "accounting.settings.manage",
      },
      {
        label: "Fund Sources",
        href: "/accounting/fund-sources",
        icon: "bx-wallet",
        permission: "accounting.settings.manage",
      },
      {
        label: "Transaction Series",
        href: "/accounting/transaction-series",
        icon: "bx-hash",
        permission: "accounting.settings.manage",
      },
      {
        label: "Settings",
        href: "/accounting/settings",
        icon: "bx-cog",
        permission: "accounting.settings.manage",
      },
    ],
  },
];
