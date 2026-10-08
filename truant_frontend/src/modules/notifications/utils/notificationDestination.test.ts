import { describe, expect, it } from "vitest";

import { getSafeNotificationDestination } from "./notificationDestination";

describe("notification destinations", () => {
  it.each([
    ["/home", "/home"],
    [
      "/ordering/forms/123?preview=1#items",
      "/ordering/forms/123?preview=1#items",
    ],
    ["/employees/list", "/employees/list"],
    ["/inventory/items", "/inventory/items"],
    ["/ordering/statements-of-account", "/ordering/statements-of-account"],
    [
      "/ordering/statements-of-account/stmt-123/print",
      "/ordering/statements-of-account/stmt-123/print",
    ],
    ["/ordering/invoices/123/print", "/ordering/invoices/123/print"],
    ["/users", "/users"],
    ["/users/roles", "/users/roles"],
    // Production/QC notification deep links (must match the backend
    // Ordering notification action_url values exactly).
    ["/production", "/production"],
    ["/production/order-123", "/production/order-123"],
    ["/production/tailor/my-assignment", "/production/tailor/my-assignment"],
    ["/production/qc/my-assignment", "/production/qc/my-assignment"],
    ["/production/qc/inspection", "/production/qc/inspection"],
    ["/production/qc/dashboard", "/production/qc/dashboard"],
    [
      "/production/production/my-assignment",
      "/production/production/my-assignment",
    ],
    [
      "/production/packaging/my-assignment",
      "/production/packaging/my-assignment",
    ],
    ["/production/tailor/reassignments", "/production/tailor/reassignments"],
    // Staff self-service portal (EmployeeAdvanceStatusUpdated deep link).
    ["/employee-portal", "/employee-portal"],
    ["/employee-portal/advances", "/employee-portal/advances"],
  ])("accepts safe ERP paths", (input, expected) => {
    expect(getSafeNotificationDestination(input)).toBe(expected);
  });

  it.each([
    null,
    "",
    "//example.com",
    "https://example.com",
    "javascript:alert(1)",
    "/unknown",
    "/employees/unknown",
    "/inventory/reports",
    "/inventory/settings",
    "/ordering/not-a-route/deeper",
    "/ordering//forms",
    "/ordering/../users",
    "/ordering/%2e%2e/users",
    "/ordering/%5Cexample.com",
    "/ordering/%E0%A4%A",
    "/production/qc/my-assignment/deeper",
    "/production/unknown-team/my-assignment",
    "/production/qc/unknown-page",
    "/employee-portal/unknown",
  ])("falls back for unsafe or unsupported values", (input) => {
    expect(getSafeNotificationDestination(input)).toBe("/home");
  });
});
