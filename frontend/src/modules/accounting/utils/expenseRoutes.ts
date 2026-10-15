export const expenseRoutes = {
  list: "/accounting/expenses",
  create: "/accounting/expenses/new",
  createWithCategory: (categoryId: string) =>
    `/accounting/expenses/new?expense_category_id=${encodeURIComponent(categoryId)}`,
  detail: (expenseId: string) => `/accounting/expenses/${expenseId}`,
  edit: (expenseId: string) => `/accounting/expenses/${expenseId}/edit`,
} as const;
