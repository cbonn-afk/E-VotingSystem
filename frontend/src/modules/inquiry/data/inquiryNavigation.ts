import type { InquiryNavigationItem } from "../types";

export type InquiryNavigationGroup = {
  label: string;
  items: InquiryNavigationItem[];
};

/** Empty groups are hidden automatically for users without the permissions. */
export const inquiryNavigation: InquiryNavigationGroup[] = [
  {
    label: "Workspace",
    items: [{ label: "Overview", href: "/inquiry", icon: "bx-home-circle" }],
  },
  {
    label: "Statements",
    items: [
      { label: "Account Balances", href: "/inquiry/balances", icon: "bx-wallet", permission: "inquiry.statements.view" },
      { label: "Savings Transactions", href: "/inquiry/transactions", icon: "bx-transfer", permission: "inquiry.statements.view" },
      { label: "Loan Balances", href: "/inquiry/loans", icon: "bx-credit-card", permission: "inquiry.statements.view" },
    ],
  },
  {
    label: "Members",
    items: [
      { label: "Inquiry Station", href: "/inquiry/station", icon: "bx-search-alt", permission: "inquiry.station.use" },
      { label: "Announcements", href: "/inquiry/announcements", icon: "bx-bell", permission: "inquiry.announcements.manage" },
    ],
  },
];
