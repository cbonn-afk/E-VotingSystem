import { describe, expect, it } from "vitest";

import { expenseRoutes } from "./expenseRoutes";

describe("expenseRoutes", () => {
  it("uses the canonical Expenses routes while safely encoding a chosen category", () => {
    expect(expenseRoutes.list).toBe("/accounting/expenses");
    expect(expenseRoutes.createWithCategory("cat / 2026")).toBe(
      "/accounting/expenses/new?expense_category_id=cat%20%2F%202026",
    );
    expect(expenseRoutes.detail("expense-1")).toBe(
      "/accounting/expenses/expense-1",
    );
    expect(expenseRoutes.edit("expense-1")).toBe(
      "/accounting/expenses/expense-1/edit",
    );
  });
});
