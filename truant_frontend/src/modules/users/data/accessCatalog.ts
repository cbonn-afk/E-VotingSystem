import type { ErpModule, PermissionDefinition } from "../types";

const modulePresentation: Record<string, Omit<ErpModule, "key">> = {
  ordering: {
    label: "Ordering",
    description: "Order forms, BOM costing, SOA, and payment workflows.",
    icon: "bx-clipboard",
    color: "primary",
  },
  production: {
    label: "Production",
    description: "Production queues, item progress, and barcode operations.",
    icon: "bx-package",
    color: "warning",
  },
  employees: {
    label: "Employees",
    description: "Employee records, attendance, payroll, and approvals.",
    icon: "bx-user",
    color: "info",
  },
  accounting: {
    label: "Accounting",
    description: "Financial records, accounts, billing, and posting.",
    icon: "bx-calculator",
    color: "success",
  },
  inventory: {
    label: "Inventory",
    description: "Stock items, movement logs, and inventory reporting.",
    icon: "bx-box",
    color: "warning",
  },
  partners: {
    label: "Partners",
    description:
      "Revenue-share partners, order allocations, earnings, and payouts.",
    icon: "bx-group",
    color: "secondary",
  },
  settings: {
    label: "Settings",
    description: "Users, roles, access, and system configuration.",
    icon: "bx-cog",
    color: "secondary",
  },
};

export const getModulePresentation = (key: string): ErpModule => ({
  key,
  ...(modulePresentation[key] ?? {
    label: key
      .split("_")
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" "),
    description: "Module permissions returned by the server.",
    icon: "bx-grid-alt",
    color: "secondary",
  }),
});

export const getAllModulePresentations = (): ErpModule[] =>
  Object.keys(modulePresentation).sort().map(getModulePresentation);

const actionDescriptions: Record<string, string> = {
  access: "Allows the user to enter and use this module.",
  view: "Allows the user to read records without changing them.",
  create: "Allows the user to add records and transactions.",
  update: "Allows the user to change existing records.",
  approve: "Allows the user to approve workflow requests.",
  delete: "Allows destructive actions where supported.",
  export: "Allows the user to download or print information.",
  manage: "Allows administrative configuration.",
  cancel: "Allows the user to cancel supported records.",
  record: "Allows the user to record transactions.",
  reconcile: "Allows the user to reconcile related transactions.",
  advance: "Allows the user to advance workflow stages.",
  reject: "Allows the user to reject workflow requests.",
  prepare: "Allows the user to prepare records for approval.",
  release: "Allows the user to release approved records.",
  post: "Allows the user to post accounting entries.",
  reverse: "Allows the user to reverse posted entries.",
  void: "Allows the user to void supported records.",
  request: "Allows the user to submit a request.",
  import: "Allows the user to import attendance evidence.",
  deactivate: "Allows the user to deactivate records.",
  complete: "Allows the user to complete workflow stages.",
};

export const permissionActionLabel = (action: string): string =>
  action
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

export const permissionActionDescription = (action: string): string =>
  actionDescriptions[action] ?? "Allows the corresponding server capability.";

// ─── Per-permission, resource-aware presentation ─────────────────────────────
//
// A permission name is `module.resource.action` (e.g. `ordering.soa.view`) or,
// for module-level grants, `module.action` (e.g. `ordering.access`). The label
// returned by the API only carries the action, so the resource — the part that
// tells a person *what* the access is for — has to be recovered from the name.

const humanize = (value: string): string =>
  value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

/** Friendly subject names for known resources (titles shown beside the box). */
const resourceLabels: Record<string, string> = {
  orders: "Order Forms",
  bom: "BOM Costing",
  soa: "Statements of Account",
  payments: "Payments",
  production_handoffs: "Production Handoffs",
  records: "Employee Records",
  attendance: "Attendance",
  "attendance.devices": "Attendance Devices",
  "attendance.mappings": "Device Mappings",
  time_logs: "Time Logs",
  overtime: "Overtime",
  advances: "Cash Advances",
  payroll: "Payroll",
  settings: "Module Settings",
  users: "User Accounts",
  roles: "Roles & Access",
  jobs: "Production Jobs",
  workflows: "Production Workflow",
  quality: "Quality Control",
  packaging: "Packaging",
  accounts: "Chart of Accounts",
  periods: "Accounting Periods",
  journals: "Journal Entries",
  vendors: "Vendors",
  expenses: "Expenses",
  "expenses.payments": "Expense Payments",
  reports: "Reports",
  items: "Inventory Items",
  movements: "Stock Movements",
  allocations: "Order Allocations",
  earnings: "Partner Earnings",
  payouts: "Partner Payouts",
  self_service: "Partner Portal",
};

/** Lowercase noun phrases used inside the description sentence. */
const resourceNouns: Record<string, string> = {
  soa: "statements of account",
  bom: "BOM costings",
  accounts: "chart-of-accounts records",
  expenses: "expenses",
  "expenses.payments": "expense payments",
  quality: "quality-control checks",
};

/** Verb phrase used in "Lets the user ___ <noun>." */
const actionVerbs: Record<string, string> = {
  view: "view",
  create: "add new",
  update: "edit existing",
  delete: "delete",
  cancel: "cancel",
  approve: "approve",
  reject: "reject",
  record: "record",
  reconcile: "reconcile",
  manage: "manage and configure",
  export: "export and print",
  post: "post",
  reverse: "reverse posted",
  void: "void",
  prepare: "prepare",
  release: "release approved",
  request: "submit",
  import: "import",
  advance: "advance the stage of",
  deactivate: "deactivate",
  complete: "complete",
};

/** Color used for the action chip so each action reads at a glance. */
const actionChipColors: Record<
  string,
  "primary" | "info" | "success" | "warning" | "error" | "secondary"
> = {
  access: "primary",
  view: "info",
  create: "success",
  update: "warning",
  approve: "success",
  release: "success",
  complete: "success",
  post: "success",
  record: "success",
  request: "info",
  import: "info",
  prepare: "info",
  reconcile: "info",
  advance: "info",
  manage: "primary",
  export: "secondary",
  delete: "error",
  cancel: "error",
  reject: "error",
  reverse: "error",
  void: "error",
  deactivate: "error",
};

export type PermissionPresentation = {
  /** The thing the permission grants access to, e.g. "Statements of Account". */
  subject: string;
  /** Short action label for the chip, e.g. "View". */
  actionLabel: string;
  /** Chip color keyed to the action. */
  actionColor:
    | "primary"
    | "info"
    | "success"
    | "warning"
    | "error"
    | "secondary";
  /** Plain-language sentence describing exactly what the permission enables. */
  description: string;
};

/**
 * The resource segment of a permission name — the part that says *what* the
 * permission is about. `ordering.soa.view` → `soa`; `ordering.access` → `""`.
 */
export const permissionResource = (name: string): string => {
  const segments = name.split(".");

  // Drop the leading module and the trailing action; whatever remains is the
  // resource. `module.action` style names have no resource.
  return segments.slice(1, -1).join(".");
};

const resourceFromName = permissionResource;

/**
 * Turns a permission into a clear, resource-aware presentation so each checkbox
 * states precisely what it grants instead of a bare "View" / "Create".
 */
export const describePermission = (
  permission: PermissionDefinition,
): PermissionPresentation => {
  const { action } = permission;
  const resource = resourceFromName(permission.name);
  const moduleLabel = getModulePresentation(permission.module).label;
  const actionLabel = permissionActionLabel(action);
  const actionColor = actionChipColors[action] ?? "secondary";

  if (action === "access") {
    return {
      subject: "Module Access",
      actionLabel: "Access",
      actionColor,
      description: `Lets the user open and use the ${moduleLabel} module.`,
    };
  }

  const subject = resource
    ? (resourceLabels[resource] ?? humanize(resource))
    : moduleLabel;
  const noun =
    resourceNouns[resource] ??
    (resource ? subject.toLowerCase() : `${moduleLabel.toLowerCase()} data`);
  const verb = actionVerbs[action] ?? action;

  return {
    subject,
    actionLabel,
    actionColor,
    description: `Lets the user ${verb} ${noun}.`,
  };
};
