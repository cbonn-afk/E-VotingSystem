import { apiClient } from "@/libs/api/apiClient";

import type { DocumentSettings, DocumentSettingsPayload } from "../types";

export const documentSettingsApi = {
  get: () => apiClient<{ data: DocumentSettings }>("/api/documents/settings"),

  update: (body: DocumentSettingsPayload) =>
    apiClient<{ data: DocumentSettings }>("/api/documents/settings", {
      method: "PATCH",
      body,
    }),

  uploadLogo: (logo: File) => {
    const body = new FormData();

    body.append("logo", logo);

    return apiClient<{ data: DocumentSettings }>(
      "/api/documents/settings/logo",
      { method: "POST", body },
    );
  },
};
