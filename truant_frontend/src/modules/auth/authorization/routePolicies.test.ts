import { describe, expect, it } from "vitest";

import { getRoutePolicy } from "./routePolicies";

describe("ordering route policies", () => {
  // Admin and Super Admin are one and the same: both hold full access.
  it("restricts order editing to full-access administrators", () => {
    expect(getRoutePolicy("/ordering/forms/order-uuid/edit")).toMatchObject({
      anyRoles: ["Super Admin", "Admin"],
    });
  });

  it("restricts partner portal routes to Partner role accounts", () => {
    expect(getRoutePolicy("/partner/earnings")).toMatchObject({
      role: "Partner",
    });
  });
});
