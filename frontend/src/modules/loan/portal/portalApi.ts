import { apiClient } from "@/libs/api/apiClient";

import type { PortalMember } from "../types";

// The portal session cookie is read by the server; this header is the extra guard it requires on non-GET calls.
const headers = { "X-Requested-With": "XMLHttpRequest" };

export const portalApi = {
  /** Member code only. Wrong codes are rate limited by the server (422, then 429). */
  login: (member_code: string) =>
    apiClient<{ data: PortalMember }>("/api/loan-portal/auth/login", {
      method: "POST",
      body: { member_code },
      headers,
    }),

  me: () => apiClient<{ data: PortalMember }>("/api/loan-portal/me"),

  logout: () => apiClient<void>("/api/loan-portal/auth/logout", { method: "POST", headers }),
};

export const portalMemberKey = ["loan-portal", "me"] as const;
