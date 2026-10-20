import { apiClient } from "@/libs/api/apiClient";

import type { AgingBucket, CollectionRow, CollectionStatus, CollectionSummary, Paginated } from "../types";

export const collectionsApi = {
  list: (params: { q?: string; status?: CollectionStatus | ""; bucket?: AgingBucket | ""; page?: number; per_page?: number }) => {
    const query = new URLSearchParams();

    if (params.q) query.set("q", params.q);
    if (params.status) query.set("status", params.status);
    if (params.bucket) query.set("bucket", params.bucket);
    query.set("page", String(params.page ?? 1));
    query.set("per_page", String(params.per_page ?? 15));

    return apiClient<Paginated<CollectionRow>>(`/api/loan/collections?${query}`);
  },

  summary: () => apiClient<{ data: CollectionSummary }>("/api/loan/collections/summary"),
};
