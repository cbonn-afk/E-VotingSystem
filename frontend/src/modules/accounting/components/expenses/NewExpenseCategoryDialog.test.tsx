import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import NewExpenseCategoryDialog from "./NewExpenseCategoryDialog";

const push = vi.fn();
const onClose = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("../../hooks/useExpenseEntryApi", () => ({
  useExpenseCategories: () => ({
    data: {
      data: [
        {
          id: "utilities-id",
          slug: "electric-bill",
          label: "Electric Bill",
          active: true,
          requiresVendor: true,
          expenseAccount: {
            id: "6210",
            code: "6210",
            name: "Electricity Expense",
          },
          defaultPayableAccount: {
            id: "2070",
            code: "2070",
            name: "Utilities Payable",
          },
        },
      ],
    },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

describe("NewExpenseCategoryDialog", () => {
  beforeEach(() => {
    push.mockReset();
    onClose.mockReset();
  });

  it("opens an icon-card onboarding choice and prefills the selected category through the URL", () => {
    render(<NewExpenseCategoryDialog open onClose={onClose} />);

    expect(
      screen.getByRole("heading", { name: "What expense are you recording?" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Electric Bill")).toBeInTheDocument();
    expect(screen.getByText("Electricity Expense")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("listitem"));

    expect(onClose).toHaveBeenCalledOnce();
    expect(push).toHaveBeenCalledWith(
      "/accounting/expenses/new?expense_category_id=utilities-id",
    );
  });
});
