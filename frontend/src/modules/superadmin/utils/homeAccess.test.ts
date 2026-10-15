import { describe, expect, it } from "vitest";

import type { User } from "@/modules/auth/types";

import { superAdminModules } from "../data/modules";
import { getAuthorizedHomeModules, getHomeLandingPath, getSingleModuleHomePath } from "./homeAccess";

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
  permissions: ["loan.access"],
  modules: ["loan"],
  require_password_change: false,
  created_at: null,
  updated_at: null,
  ...overrides,
});

describe("home access", () => {
  it("sends a single-module user straight to that module", () => {
    expect(getSingleModuleHomePath(user(), superAdminModules)).toBe("/loan");
    expect(getHomeLandingPath(user(), superAdminModules)).toBe("/loan");
  });

  it("keeps the chooser for users with several modules", () => {
    const multi = user({
      permissions: ["loan.access", "election.access", "members.view"],
      modules: ["loan", "election", "members"],
    });

    expect(getSingleModuleHomePath(multi, superAdminModules)).toBeNull();
    expect(getAuthorizedHomeModules(multi, superAdminModules).map((m) => m.href)).toEqual([
      "/election",
      "/loan",
      "/members",
    ]);
  });

  it("never redirects full-access users", () => {
    const admin = user({ is_super_admin: true, permissions: [], modules: [] });

    expect(getSingleModuleHomePath(admin, superAdminModules)).toBeNull();
    expect(getAuthorizedHomeModules(admin, superAdminModules).map((m) => m.href)).toEqual([
      "/election",
      "/loan",
      "/members",
      "/inquiry",
      "/users",
    ]);
  });

  it("hides cards the user cannot open", () => {
    expect(getAuthorizedHomeModules(user({ permissions: [], modules: [] }), superAdminModules)).toEqual([]);
  });
});
