import ExpenseEditView from "@/modules/accounting/views/expenses/ExpenseEditView";

type PageProps = { params: Promise<{ expenseId: string }> };

export default async function Page({ params }: PageProps) {
  const { expenseId } = await params;

  return <ExpenseEditView billId={expenseId} />;
}

