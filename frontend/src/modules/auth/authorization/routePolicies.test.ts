import { describe, expect, it } from "vitest";

import { getRoutePolicy } from "./routePolicies";

describe("route policies", () => {
  it("protects the shared members list", () => {
    expect(getRoutePolicy("/members")).toMatchObject({ permission: "members.view" });
  });

  it("uses the most specific Election permission", () => {
    expect(getRoutePolicy("/election/results")).toMatchObject({ permission: "election.results.view" });
    expect(getRoutePolicy("/election")).toMatchObject({ permission: "election.access" });
  });

  it("separates Loan settings from the rest of Loan", () => {
    expect(getRoutePolicy("/loan/settings")).toMatchObject({ permission: "loan.settings.manage" });
    expect(getRoutePolicy("/loan/approval-levels")).toMatchObject({ permission: "loan.settings.manage" });
    expect(getRoutePolicy("/loan/applications/12")).toMatchObject({ permission: "loan.applications.view" });
    expect(getRoutePolicy("/loan/loans/5/payments/9/receipt")).toMatchObject({ permission: "loan.payments.view" });
    expect(getRoutePolicy("/loan/products")).toMatchObject({ permission: "loan.products.manage" });
    expect(getRoutePolicy("/loan")).toMatchObject({ permission: "loan.access" });
  });

  it("requires role permissions to edit roles", () => {
    expect(getRoutePolicy("/users/roles/new")).toMatchObject({ permission: "settings.roles.manage" });
    expect(getRoutePolicy("/users/roles/3/edit")).toMatchObject({ permission: "settings.roles.manage" });
  });

  it("does not guard the public member portal", () => {
    expect(getRoutePolicy("/loan-portal")).toBeUndefined();
  });
});
