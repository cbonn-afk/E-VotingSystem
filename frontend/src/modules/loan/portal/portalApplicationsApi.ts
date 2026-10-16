import { apiClient } from "@/libs/api/apiClient";

import type { ApplicationDetailsPayload, LoanApplication, LoanProduct } from "../types";

const headers = { "X-Requested-With": "XMLHttpRequest" };
const base = "/api/loan-portal";

export const portalApplicationsApi = {
  products: () => apiClient<{ data: LoanProduct[] }>(`${base}/products`),
  list: () => apiClient<{ data: LoanApplication[] }>(`${base}/applications`),
  get: (id: number) => apiClient<{ data: LoanApplication }>(`${base}/applications/${id}`),

  create: (productId: number, body: ApplicationDetailsPayload) =>
    apiClient<{ data: LoanApplication }>(`${base}/applications`, {
      method: "POST",
      body: { product_id: productId, ...body },
      headers,
    }),

  update: (id: number, body: ApplicationDetailsPayload) =>
    apiClient<{ data: LoanApplication }>(`${base}/applications/${id}`, { method: "PATCH", body, headers }),

  cancel: (id: number) => apiClient<void>(`${base}/applications/${id}`, { method: "DELETE", headers }),

  uploadDocument: (id: number, requirement: string, file: File) => {
    const body = new FormData();

    body.append("requirement", requirement);
    body.append("file", file);

    return apiClient<{ data: LoanApplication }>(`${base}/applications/${id}/documents`, { method: "POST", body, headers });
  },

  deleteDocument: (id: number, documentId: number) =>
    apiClient<{ data: LoanApplication }>(`${base}/applications/${id}/documents/${documentId}`, { method: "DELETE", headers }),

  setGuarantors: (id: number, member_codes: string[]) =>
    apiClient<{ data: LoanApplication }>(`${base}/applications/${id}/guarantors`, {
      method: "PUT",
      body: { member_codes },
      headers,
    }),

  saveSignature: (id: number, signature: string) =>
    apiClient<{ data: LoanApplication }>(`${base}/applications/${id}/signature`, {
      method: "POST",
      body: { signature },
      headers,
    }),

  signAgreement: (id: number, signature: string | null) =>
    apiClient<{ data: LoanApplication }>(`${base}/applications/${id}/agreement/sign`, {
      method: "POST",
      body: { agreed: true, signature },
      headers,
    }),

  submit: (id: number) =>
    apiClient<{ data: LoanApplication }>(`${base}/applications/${id}/submit`, {
      method: "POST",
      body: { confirmed: true },
      headers,
    }),
};
