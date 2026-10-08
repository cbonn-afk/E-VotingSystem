import { describe, expect, it } from "vitest";

import type { User } from "@/modules/auth/types";

import {
  can,
  canAccessEmployeePortal,
  canAccessModule,
  canAccessPartnerPortal,
  canAll,
  canAny,
  cannot,
  filterAuthorizedNavigation,
  filterAuthorizedItems,
  hasAnyRole,
  hasRole,
  hasSingleModuleAccess,
  shouldShowSystemHomeLink,
} from "./authorization";

const user = (overrides: Partial<User> = {}): User => ({
  id: 1,
  name: "ERP User",
  email: "user@example.com",
  phone: null,
  address: null,
  avatar_url: null,
  theme_preference: "system",
  email_verified_at: null,
  status: "active",
  deactivated_at: null,
  is_super_admin: false,
  has_employee_profile: false,
  roles: ["Ordering Staff"],
  permissions: ["ordering.access", "ordering.orders.view"],
  modules: ["ordering"],
  require_password_change: false,
  created_at: null,
  updated_at: null,
  ...overrides,
});

describe("authorization helpers", () => {
  it("denies unauthenticated users", () => {
    expect(can(null, "ordering.orders.view")).toBe(false);
    expect(canAccessModule(undefined, "ordering")).toBe(false);
  });

  it("allows and denies ordinary users from effective permissions", () => {
    expect(can(user(), "ordering.orders.view")).toBe(true);
    expect(cannot(user(), "ordering.orders.create")).toBe(true);
  });

  it("allows Super Admin permission and module checks", () => {
    const superAdmin = user({
      is_super_admin: true,
      permissions: [],
      modules: [],
    });

    expect(can(superAdmin, "accounting.journals.post")).toBe(true);
    expect(canAccessModule(superAdmin, "accounting")).toBe(true);
  });

  it("supports any and all permission checks", () => {
    expect(
      canAny(user(), ["ordering.orders.create", "ordering.orders.view"]),
    ).toBe(true);
    expect(canAll(user(), ["ordering.access", "ordering.orders.view"])).toBe(
      true,
    );
    expect(
      canAll(user(), ["ordering.orders.view", "ordering.orders.create"]),
    ).toBe(false);
  });

  it("supports role checks", () => {
    expect(hasRole(user(), "Ordering Staff")).toBe(true);
    expect(hasAnyRole(user(), ["Employee", "Ordering Staff"])).toBe(true);
    expect(hasAnyRole(user(), ["Accounting Staff"])).toBe(false);
  });

  it("filters navigation without changing order", () => {
    const items = [
      { label: "Overview", href: "/ordering", icon: "home" },
      {
        label: "Orders",
        href: "/ordering/forms",
        icon: "list",
        permission: "ordering.orders.view" as const,
      },
      {
        label: "Settings",
        href: "/ordering/settings",
        icon: "cog",
        permission: "ordering.settings.manage" as const,
      },
    ];

    expect(
      filterAuthorizedItems(user(), items).map((item) => item.label),
    ).toEqual(["Overview", "Orders"]);
  });

  it("treats a single-module non-super-admin as single-module access", () => {
    const singleModuleUser = user({ modules: ["ordering"] });

    expect(hasSingleModuleAccess(singleModuleUser)).toBe(true);
    expect(shouldShowSystemHomeLink(singleModuleUser)).toBe(false);
  });

  it("shows the system home link for multi-module users", () => {
    const multiModuleUser = user({ modules: ["ordering", "inventory"] });

    expect(hasSingleModuleAccess(multiModuleUser)).toBe(false);
    expect(shouldShowSystemHomeLink(multiModuleUser)).toBe(true);
  });

  it("does not count the employee portal as a separate module", () => {
    const employeeWithModule = user({
      account_type: "Employee",
      has_employee_profile: true,
      can_access_employee_portal: true,
      permissions: [
        "employees.self_service",
        "ordering.access",
        "ordering.orders.view",
      ],
      modules: ["ordering"],
    });

    expect(hasSingleModuleAccess(employeeWithModule)).toBe(true);
    expect(shouldShowSystemHomeLink(employeeWithModule)).toBe(false);
  });

  it("hides the system home link for portal-only employees", () => {
    expect(
      shouldShowSystemHomeLink(
        user({
          account_type: "Employee",
          has_employee_profile: true,
          can_access_employee_portal: true,
          permissions: ["employees.self_service"],
          modules: [],
        }),
      ),
    ).toBe(false);
  });

  it("shows the system home link for super admins regardless of modules", () => {
    const superAdmin = user({ is_super_admin: true, modules: ["ordering"] });

    expect(hasSingleModuleAccess(superAdmin)).toBe(false);
    expect(shouldShowSystemHomeLink(superAdmin)).toBe(true);
  });

  it("keeps administrative accounts out of self-service portals", () => {
    const admin = user({
      account_type: "System",
      roles: ["Admin"],
      permissions: ["employees.self_service", "partners.self_service.view"],
      has_employee_profile: true,
    });

    expect(canAccessEmployeePortal(admin)).toBe(false);
    expect(canAccessPartnerPortal(admin)).toBe(false);
  });

  it("allows only profile-backed employee and partner portal accounts", () => {
    expect(
      canAccessEmployeePortal(
        user({
          account_type: "Employee",
          has_employee_profile: true,
          permissions: ["employees.self_service"],
        }),
      ),
    ).toBe(true);
    expect(
      canAccessPartnerPortal(
        user({
          account_type: "Partner",
          roles: ["Partner"],
          can_access_partner_portal: true,
        }),
      ),
    ).toBe(true);
  });

  it("hides the system home link while unauthenticated or loading", () => {
    expect(shouldShowSystemHomeLink(null)).toBe(false);
    expect(shouldShowSystemHomeLink(undefined)).toBe(false);
    expect(hasSingleModuleAccess(null)).toBe(false);
  });

  it("removes empty groups and retains parents with authorized children", () => {
    const navigation = [
      {
        label: "Ordering",
        children: [
          { label: "Orders", permission: "ordering.orders.view" as const },
          {
            label: "Settings",
            permission: "ordering.settings.manage" as const,
          },
        ],
      },
      {
        label: "Accounting",
        children: [
          {
            label: "Journals",
            permission: "accounting.journals.view" as const,
          },
        ],
      },
      { label: "Help" },
    ];

    expect(filterAuthorizedNavigation(user(), navigation)).toEqual([
      {
        label: "Ordering",
        children: [{ label: "Orders", permission: "ordering.orders.view" }],
      },
      { label: "Help" },
    ]);
  });
});
