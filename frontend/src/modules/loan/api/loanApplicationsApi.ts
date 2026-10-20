import { apiClient } from "@/libs/api/apiClient";

import type {
  AgreementPreview,
  ApplicationStatus,
  DecisionPayload,
  EvaluationPayload,
  LoanApplication,
  Paginated,
  ReleasePayload,
} from "../types";

export type ApplicationAction = "accept" | "return" | "reject";

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

  evaluate: (id: number, body: EvaluationPayload) =>
    apiClient<{ data: LoanApplication }>(`/api/loan/applications/${id}/evaluation`, { method: "POST", body }),

  decide: (id: number, body: DecisionPayload) =>
    apiClient<{ data: LoanApplication }>(`/api/loan/applications/${id}/decision`, { method: "POST", body }),

  previewAgreement: (id: number, first_due_date: string) =>
    apiClient<{ data: AgreementPreview }>(`/api/loan/applications/${id}/agreement/preview`, { method: "POST", body: { first_due_date } }),

  generateAgreement: (id: number, first_due_date: string) =>
    apiClient<{ data: LoanApplication }>(`/api/loan/applications/${id}/agreement`, { method: "POST", body: { first_due_date } }),

  release: (id: number, body: ReleasePayload) =>
    apiClient<{ data: LoanApplication }>(`/api/loan/applications/${id}/release`, { method: "POST", body }),

};
