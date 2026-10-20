import { apiClient } from "@/libs/api/apiClient";

import type { PortalMember } from "../types";

// The portal session cookie is read by the server; this header is the extra guard it requires on non-GET calls.
const headers = { "X-Requested-With": "XMLHttpRequest" };

export const portalApi = {
  /** Member code + password. Wrong attempts are rate limited by the server (422, then 429). */
  login: (member_code: string, password: string) =>
    apiClient<{ data: PortalMember }>("/api/loan-portal/auth/login", {
      method: "POST",
      body: { member_code, password },
      headers,
    }),

  /** Replaces the default password. Until this succeeds the rest of the portal answers 428. */
  changePassword: (body: { current_password: string; password: string; password_confirmation: string }) =>
    apiClient<{ data: PortalMember }>("/api/loan-portal/auth/password", { method: "POST", body, headers }),

  me: () => apiClient<{ data: PortalMember }>("/api/loan-portal/me"),

  logout: () => apiClient<void>("/api/loan-portal/auth/logout", { method: "POST", headers }),
};

export const portalMemberKey = ["loan-portal", "me"] as const;
