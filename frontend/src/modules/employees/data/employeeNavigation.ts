// Type Imports
import type { EmployeesNavigationItem } from "../types";

export type EmployeesNavigationGroup = {
  /** Plain-language heading shown above the group in the sidebar. */
  label: string;
  items: EmployeesNavigationItem[];
};

/**
 * Sidebar grouped by what staff are doing — records, time & pay, requests —
 * so the menu reads by purpose instead of a long flat list. Empty groups
 * (no permitted items) are hidden automatically.
 */
export const employeeNavigation: EmployeesNavigationGroup[] = [
  {
    label: "Workspace",
    items: [{ label: "Overview", href: "/employees", icon: "bx-user" }],
  },
  {
    label: "Records",
    items: [
      {
        label: "Employees List",
        href: "/employees/list",
        icon: "bx-list-ul",
        permission: "employees.records.view",
      },
      {
        label: "Branches",
        href: "/employees/branches",
        icon: "bx-buildings",
        permission: "employees.records.view",
      },
    ],
  },
  {
    label: "Pay",
    items: [
      {
        label: "Attendance",
        href: "/employees/attendance",
        icon: "bx-calendar-check",
        permission: "employees.attendance.view",
      },
      {
        label: "Overtime",
        href: "/employees/overtimes",
        icon: "bx-timer",
        permission: "employees.overtime.view",
      },
      {
        label: "Cash Advances",
        href: "/employees/advances",
        icon: "bx-credit-card",
        permission: "employees.advances.view",
      },
      {
        label: "Payroll",
        href: "/employees/payrolls",
        icon: "bx-money",
        permission: "employees.payroll.view",
      },
    ],
  },
  {
    label: "Configuration",
    items: [
      {
        label: "Employee Settings",
        href: "/employees/settings",
        icon: "bx-cog",
        permission: "employees.settings.manage",
      },
    ],
  },
];
