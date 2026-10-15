import { apiClient } from "@/libs/api/apiClient";

import type { LoanSettings } from "../types";

export const loanSettingsApi = {
  get: () => apiClient<{ data: LoanSettings }>("/api/loan/settings"),

  update: (body: LoanSettings) =>
    apiClient<{ data: LoanSettings }>("/api/loan/settings", {
      method: "PATCH",
      body,
    }),
};
