import { apiClient } from "@/libs/api/apiClient";

import type { LoanDetail } from "../types";

export const portalLoansApi = {
  list: () => apiClient<{ data: LoanDetail[] }>("/api/loan-portal/loans"),
  get: (id: number) => apiClient<{ data: LoanDetail }>(`/api/loan-portal/loans/${id}`),
};
