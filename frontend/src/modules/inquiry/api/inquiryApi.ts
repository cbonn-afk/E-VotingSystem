import { apiClient } from "@/libs/api/apiClient";

import type {
  AnnouncementResource,
  BalanceResource,
  ImportResult,
  InquirySummary,
  ListParams,
  LoanResource,
  MemberStatement,
  PaginatedResponse,
  ResourceResponse,
  StatementType,
  TransactionResource,
} from "./types";

const BASE = "/api/inquiry";

const query = (params: ListParams = {}): string => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });

  const value = search.toString();

  return value ? `?${value}` : "";
};

const resource = <T>(path: string, init?: Parameters<typeof apiClient>[1]) =>
  apiClient<ResourceResponse<T>>(path, init);

export type AnnouncementPayload = {
  title: string;
  body: string;
  isPublished: boolean;
  image?: File | null;
  removeImage?: boolean;
};

const announcementForm = (payload: AnnouncementPayload): FormData => {
  const body = new FormData();

  body.append("title", payload.title);
  body.append("body", payload.body);
  body.append("is_published", payload.isPublished ? "1" : "0");
  if (payload.image) body.append("image", payload.image);
  if (payload.removeImage) body.append("remove_image", "1");

  return body;
};

export const inquiryApi = {
  summary: () => resource<InquirySummary>(`${BASE}/summary`),
  balances: (params: ListParams = {}) =>
    apiClient<PaginatedResponse<BalanceResource>>(`${BASE}/balances${query(params)}`),
  transactions: (params: ListParams = {}) =>
    apiClient<PaginatedResponse<TransactionResource>>(`${BASE}/transactions${query(params)}`),
  loans: (params: ListParams = {}) =>
    apiClient<PaginatedResponse<LoanResource>>(`${BASE}/loans${query(params)}`),

  imports: {
    /** commit=false only checks the file; commit=true replaces the data. */
    run: (type: StatementType, file: File, commit: boolean) => {
      const body = new FormData();

      body.append("file", file);
      body.append("commit", commit ? "1" : "0");

      return resource<ImportResult>(`${BASE}/imports/${type}`, { method: "POST", body });
    },
    templateUrl: (type: StatementType) =>
      `${process.env.NEXT_PUBLIC_API_URL ?? ""}${BASE}/imports/${type}/template`,
  },

  station: {
    lookup: (code: string) =>
      resource<MemberStatement>(`${BASE}/station/lookup`, { method: "POST", body: { code } }),
  },

  announcements: {
    list: () => resource<AnnouncementResource[]>(`${BASE}/announcements`),
    create: (payload: AnnouncementPayload) =>
      resource<AnnouncementResource>(`${BASE}/announcements`, {
        method: "POST",
        body: announcementForm(payload),
      }),
    update: (id: number, payload: AnnouncementPayload) =>
      resource<AnnouncementResource>(`${BASE}/announcements/${id}`, {
        method: "POST",
        body: announcementForm(payload),
      }),
    remove: (id: number) => apiClient<void>(`${BASE}/announcements/${id}`, { method: "DELETE" }),
  },
};
