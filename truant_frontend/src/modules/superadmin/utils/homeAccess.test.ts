import { describe, expect, it } from "vitest";

import type { User } from "@/modules/auth/types";

import { superAdminModules } from "../data/modules";
import {
  getAuthorizedHomeModules,
  getHomeLandingPath,
  getSingleModuleHomePath,
} from "./homeAccess";

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

describe("home access", () => {
  it("returns the only accessible module home", () => {
    expect(getSingleModuleHomePath(user(), superAdminModules)).toBe(
      "/ordering",
    );
  });

  it("does not redirect users with multiple accessible modules", () => {
    expect(
      getSingleModuleHomePath(
        user({
          permissions: [
            "ordering.access",
            "ordering.orders.view",
            "employees.access",
          ],
          modules: ["ordering", "employees"],
        }),
        superAdminModules,
      ),
    ).toBeNull();
  });

  it("keeps the chooser for an employee with multiple module roles", () => {
    const employee = user({
      account_type: "Employee",
      has_employee_profile: true,
      can_access_employee_portal: true,
      employee_portal_path: "/employee-portal",
      permissions: [
        "employees.self_service",
        "ordering.access",
        "ordering.orders.view",
        "production.access",
        "production.jobs.view",
      ],
      modules: ["ordering", "production"],
      employee_workspace: {
        role: "Quality Control",
        label: "Quality Control Workspace",
        module: "production",
        home_path: "/production/qc/dashboard",
      },
    });

    expect(
      getAuthorizedHomeModules(employee, superAdminModules).map((module) => ({
        title: module.title,
        href: module.href,
      })),
    ).toEqual([
      { title: "Sales", href: "/ordering" },
      { title: "Production", href: "/production/qc/dashboard" },
    ]);
    expect(getSingleModuleHomePath(employee, superAdminModules)).toBeNull();
    expect(getHomeLandingPath(employee, superAdminModules)).toBeNull();
  });

  it("keeps portal-only employees out of an empty home page", () => {
    expect(
      getHomeLandingPath(
        user({
          account_type: "Employee",
          has_employee_profile: true,
          can_access_employee_portal: true,
          employee_portal_path: "/employee-portal",
          permissions: ["employees.self_service"],
          modules: [],
        }),
        superAdminModules,
      ),
    ).toBe("/employee-portal");
  });

  it("resolves an employee production card to the assigned workspace", () => {
    const employee = user({
      account_type: "Employee",
      has_employee_profile: true,
      can_access_employee_portal: true,
      permissions: [
        "employees.self_service",
        "production.access",
        "production.jobs.view",
      ],
      modules: ["production"],
      employee_workspace: {
        role: "Quality Control",
        label: "Quality Control Workspace",
        module: "production",
        home_path: "/production/qc/dashboard",
      },
    });

    expect(
      getAuthorizedHomeModules(employee, superAdminModules).find(
        (module) => module.title === "Production",
      )?.href,
    ).toBe("/production/qc/dashboard");
    expect(getSingleModuleHomePath(employee, superAdminModules)).toBe(
      "/production/qc/dashboard",
    );
    expect(getHomeLandingPath(employee, superAdminModules)).toBe(
      "/production/qc/dashboard",
    );
  });

  it("redirects a user-management-only user to the users page", () => {
    expect(
      getSingleModuleHomePath(
        user({
          roles: ["Administrator"],
          permissions: ["settings.access", "settings.users.view"],
          modules: ["settings"],
        }),
        superAdminModules,
      ),
    ).toBe("/users");
  });

  it("keeps the workspace chooser for Super Admin", () => {
    expect(
      getSingleModuleHomePath(
        user({
          is_super_admin: true,
          roles: ["Super Admin"],
          permissions: [],
          modules: [],
        }),
        superAdminModules,
      ),
    ).toBeNull();
  });

  it("does not redirect to a landing page the user cannot open", () => {
    const employee = user({
      roles: ["Production Staff"],
      permissions: ["production.access"],
      modules: ["production"],
    });

    expect(getAuthorizedHomeModules(employee, superAdminModules)).toEqual([]);
    expect(getSingleModuleHomePath(employee, superAdminModules)).toBeNull();
  });

  it("sends tailors with only production access to their dashboard", () => {
    expect(
      getSingleModuleHomePath(
        user({
          roles: ["Tailor"],
          permissions: [
            "production.access",
            "production.jobs.view",
            "production.workflows.advance",
          ],
          modules: ["production"],
        }),
        superAdminModules,
      ),
    ).toBe("/production/tailor/dashboard");
  });

  it("sends production team with only production access to their dashboard", () => {
    expect(
      getSingleModuleHomePath(
        user({
          roles: ["Production Staff"],
          permissions: [
            "production.access",
            "production.jobs.view",
            "production.workflows.advance",
          ],
          modules: ["production"],
        }),
        superAdminModules,
      ),
    ).toBe("/production/production/dashboard");
  });

  it("sends qc team with only qc access to their dashboard", () => {
    expect(
      getSingleModuleHomePath(
        user({
          roles: ["Quality Control"],
          permissions: [
            "production.access",
            "production.jobs.view",
            "production.workflows.advance",
          ],
          modules: ["production"],
        }),
        superAdminModules,
      ),
    ).toBe("/production/qc/dashboard");
  });

  it("hides the admin Partners card from self-service-only partners", () => {
    const partnerUser = user({
      account_type: "Partner",
      roles: ["Partner"],
      permissions: ["partners.access", "partners.self_service.view"],
      modules: ["partners"],
      can_access_partner_portal: true,
      partner_portal_path: "/partner",
    });

    expect(
      getAuthorizedHomeModules(partnerUser, superAdminModules).map(
        (module) => module.title,
      ),
    ).not.toContain("Partners");
    expect(getSingleModuleHomePath(partnerUser, superAdminModules)).toBeNull();
    expect(getHomeLandingPath(partnerUser, superAdminModules)).toBe("/partner");
  });

  it("shows the admin Partners card to staff who manage partners", () => {
    expect(
      getAuthorizedHomeModules(
        user({
          roles: ["Admin"],
          permissions: ["partners.access", "partners.records.view"],
          modules: ["partners"],
        }),
        superAdminModules,
      ).map((module) => module.title),
    ).toContain("Partners");
  });

  it("sends packaging team with only packaging access to their dashboard", () => {
    expect(
      getSingleModuleHomePath(
        user({
          roles: ["Packaging Staff"],
          permissions: [
            "production.access",
            "production.jobs.view",
            "production.workflows.advance",
          ],
          modules: ["production"],
        }),
        superAdminModules,
      ),
    ).toBe("/production/packaging/dashboard");
  });
});
