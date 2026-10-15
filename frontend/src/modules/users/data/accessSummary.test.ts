import { describe, expect, it } from "vitest";

import { getModulesFromRoles, hasSuperAdminRole } from "./accessSummary";

describe("user access summaries", () => {
  it("treats Super Admin as full system access without explicit permissions", () => {
    const roles = [{ name: "Super Admin", permissionIds: [] }];

    expect(hasSuperAdminRole(roles)).toBe(true);
    expect(getModulesFromRoles(roles).map((module) => module.key)).toEqual([
      "election",
      "inquiry",
      "loan",
      "members",
      "settings",
    ]);
  });

  it("derives ordinary role modules from explicit permissions", () => {
    const roles = [
      {
        name: "Loan Officer",
        permissionIds: ["loan.access", "loan.applications.view", "members.view"],
      },
    ];

    expect(getModulesFromRoles(roles).map((module) => module.key)).toEqual([
      "loan",
      "members",
    ]);
  });
});
