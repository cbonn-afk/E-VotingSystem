import type { ListParams } from "./api/types";

export const inquiryQueryKeys = {
  all: ["inquiry"] as const,
  summary: () => [...inquiryQueryKeys.all, "summary"] as const,
  balances: (params: ListParams = {}) => [...inquiryQueryKeys.all, "balances", params] as const,
  transactions: (params: ListParams = {}) => [...inquiryQueryKeys.all, "transactions", params] as const,
  loans: (params: ListParams = {}) => [...inquiryQueryKeys.all, "loans", params] as const,
  announcements: () => [...inquiryQueryKeys.all, "announcements"] as const,
};
