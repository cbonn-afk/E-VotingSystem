import { apiClient } from "@/libs/api/apiClient";

import type { ApplicationStatus, LoanApplication, Paginated } from "../types";

export type ApplicationAction = "start_review" | "return" | "accept_documents" | "reject";

export const loanApplicationsApi = {
  list: (params: { q?: string; status?: ApplicationStatus | ""; page?: number; per_page?: number }) => {
    const query = new URLSearchParams();

    if (params.q) query.set("q", params.q);
    if (params.status) query.set("status", params.status);
    query.set("page", String(params.page ?? 1));
    query.set("per_page", String(params.per_page ?? 15));

    return apiClient<Paginated<LoanApplication>>(`/api/loan/applications?${query}`);
  },

  get: (id: number) => apiClient<{ data: LoanApplication }>(`/api/loan/applications/${id}`),

  transition: (id: number, action: ApplicationAction, remarks?: string) =>
    apiClient<{ data: LoanApplication }>(`/api/loan/applications/${id}/transition`, {
      method: "POST",
      body: { action, remarks: remarks ?? null },
    }),

  reviewDocument: (id: number, documentId: number, status: "accepted" | "rejected", remarks?: string) =>
    apiClient<{ data: LoanApplication }>(`/api/loan/applications/${id}/documents/${documentId}`, {
      method: "PATCH",
      body: { status, remarks: remarks ?? null },
    }),
};
