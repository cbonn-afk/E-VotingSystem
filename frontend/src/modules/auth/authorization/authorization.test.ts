import { describe, expect, it } from "vitest";

import type { User } from "@/modules/auth/types";

import {
  can,
  canAccessModule,
  canAll,
  canAny,
  cannot,
  filterAuthorizedNavigation,
  hasAnyRole,
  hasRole,
  hasSingleModuleAccess,
  isAuthorized,
  shouldShowSystemHomeLink,
} from "./authorization";

const user = (overrides: Partial<User> = {}): User => ({
  id: 1,
  name: "Loan Officer",
  email: "officer@example.com",
  phone: null,
  address: null,
  avatar_url: null,
  theme_preference: "system",
  email_verified_at: null,
  status: "active",
  deactivated_at: null,
  is_super_admin: false,
  roles: ["Member"],
  permissions: ["loan.access", "loan.applications.view"],
  modules: ["loan"],
  require_password_change: false,
  created_at: null,
  updated_at: null,
  ...overrides,
});

const fullAccess = user({ is_super_admin: true, roles: ["Super Admin"], permissions: [], modules: [] });

describe("authorization helpers", () => {
  it("denies unauthenticated users", () => {
    expect(can(null, "loan.access")).toBe(false);
    expect(canAccessModule(undefined, "loan")).toBe(false);
  });

  it("allows and denies ordinary users from their permissions", () => {
    expect(can(user(), "loan.applications.view")).toBe(true);
    expect(cannot(user(), "loan.approve")).toBe(true);
  });

  it("gives Super Admin and Admin every permission and module", () => {
    expect(can(fullAccess, "election.results.view")).toBe(true);
    expect(canAccessModule(fullAccess, "members")).toBe(true);
  });

  it("supports any and all checks", () => {
    expect(canAny(user(), ["loan.approve", "loan.access"])).toBe(true);
    expect(canAll(user(), ["loan.access", "loan.approve"])).toBe(false);
    expect(canAny(user(), [])).toBe(false);
  });

  it("checks roles", () => {
    expect(hasRole(user(), "Member")).toBe(true);
    expect(hasAnyRole(user(), ["Admin", "Super Admin"])).toBe(false);
  });

  it("detects a single-module user, who has no home launcher to return to", () => {
    expect(hasSingleModuleAccess(user())).toBe(true);
    expect(shouldShowSystemHomeLink(user())).toBe(false);
    expect(shouldShowSystemHomeLink(user({ modules: ["loan", "members"] }))).toBe(true);
    expect(hasSingleModuleAccess(fullAccess)).toBe(false);
  });

  it("combines requirements with AND", () => {
    expect(isAuthorized(user(), { permission: "loan.access", module: "loan" })).toBe(true);
    expect(isAuthorized(user(), { permission: "loan.access", module: "election" })).toBe(false);
  });

  it("filters navigation and drops empty groups", () => {
    const nav = [
      { label: "Loan", children: [{ label: "Applications", permission: "loan.applications.view" as const }] },
      { label: "Election", children: [{ label: "Results", permission: "election.results.view" as const }] },
    ];

    expect(filterAuthorizedNavigation(user(), nav).map((n) => n.label)).toEqual(["Loan"]);
  });
});
