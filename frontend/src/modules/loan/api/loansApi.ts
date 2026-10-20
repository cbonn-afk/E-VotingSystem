import { apiClient } from "@/libs/api/apiClient";

import type { LoanDetail, LoanStatus, Paginated, RecordPaymentPayload } from "../types";

export const loansApi = {
  list: (params: { q?: string; status?: LoanStatus | ""; page?: number; per_page?: number }) => {
    const query = new URLSearchParams();

    if (params.q) query.set("q", params.q);
    if (params.status) query.set("status", params.status);
    query.set("page", String(params.page ?? 1));
    query.set("per_page", String(params.per_page ?? 15));

    return apiClient<Paginated<LoanDetail>>(`/api/loan/loans?${query}`);
  },

  get: (id: number) => apiClient<{ data: LoanDetail }>(`/api/loan/loans/${id}`),

  recordPayment: (id: number, body: RecordPaymentPayload) =>
    apiClient<{ data: LoanDetail }>(`/api/loan/loans/${id}/payments`, { method: "POST", body }),

  voidPayment: (id: number, paymentId: number, reason: string) =>
    apiClient<{ data: LoanDetail }>(`/api/loan/loans/${id}/payments/${paymentId}/void`, { method: "POST", body: { reason } }),
};
