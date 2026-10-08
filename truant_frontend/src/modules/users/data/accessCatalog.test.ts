import { describe, expect, it } from "vitest";

import { describePermission } from "./accessCatalog";

describe("permission presentation", () => {
  it.each([
    [
      "accounting.expenses.payments.create",
      "create",
      "Expense Payments",
      "Create",
      "add new expense payments",
    ],
    [
      "accounting.expenses.payments.void",
      "void",
      "Expense Payments",
      "Void",
      "void expense payments",
    ],
  ])(
    "presents %s as a bill-payment permission",
    (name, action, subject, actionLabel, description) => {
      expect(
        describePermission({
          id: name,
          name,
          module: "accounting",
          action,
          label: actionLabel,
        }),
      ).toMatchObject({
        subject,
        actionLabel,
        description: `Lets the user ${description}.`,
      });
    },
  );

  it("presents the parent expense resource as Expenses", () => {
    expect(
      describePermission({
        id: "accounting.expenses.view",
        name: "accounting.expenses.view",
        module: "accounting",
        action: "view",
        label: "View",
      }),
    ).toMatchObject({
      subject: "Expenses",
      description: "Lets the user view expenses.",
    });
  });
});
