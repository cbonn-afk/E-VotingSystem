import { apiClient } from "@/libs/api/apiClient";

import type { LoanProduct, LoanProductPayload, Paginated } from "../types";

export const loanProductsApi = {
  list: (params: { q?: string; page?: number; per_page?: number }) => {
    const query = new URLSearchParams();

    if (params.q) query.set("q", params.q);
    query.set("page", String(params.page ?? 1));
    query.set("per_page", String(params.per_page ?? 15));

    return apiClient<Paginated<LoanProduct>>(`/api/loan/products?${query}`);
  },

  create: (body: LoanProductPayload) =>
    apiClient<{ data: LoanProduct }>("/api/loan/products", { method: "POST", body }),

  update: (id: number, body: LoanProductPayload) =>
    apiClient<{ data: LoanProduct }>(`/api/loan/products/${id}`, { method: "PATCH", body }),
};
