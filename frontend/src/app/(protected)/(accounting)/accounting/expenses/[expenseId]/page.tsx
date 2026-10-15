import ExpenseDetailView from "@/modules/accounting/views/expenses/ExpenseDetailView";

type PageProps = { params: Promise<{ expenseId: string }> };

export default async function Page({ params }: PageProps) {
  const { expenseId } = await params;

  return <ExpenseDetailView billId={expenseId} />;
}

