import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { collectionsApi } from "../api/collectionsApi";
import type { AgingBucket, CollectionStatus } from "../types";

export const useCollections = (params: { q?: string; status?: CollectionStatus | ""; bucket?: AgingBucket | ""; page: number; per_page: number }) =>
  useQuery({ queryKey: ["loan", "collections", "list", params], queryFn: () => collectionsApi.list(params), placeholderData: keepPreviousData });

export const useCollectionSummary = (enabled = true) =>
  useQuery({ queryKey: ["loan", "collections", "summary"], queryFn: collectionsApi.summary, enabled });
