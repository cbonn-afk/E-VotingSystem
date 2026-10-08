"use client";

import { useSearchParams } from "next/navigation";

import ExpenseForm from "../../components/expenses/ExpenseForm";

const ExpenseCreateView = () => {
  const searchParams = useSearchParams();

  return (
    <ExpenseForm
      initialCategoryId={searchParams.get("expense_category_id") ?? undefined}
    />
  );
};

export default ExpenseCreateView;
