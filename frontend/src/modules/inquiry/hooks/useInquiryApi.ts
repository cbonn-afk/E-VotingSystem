import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { inquiryApi, type AnnouncementPayload } from "../api/inquiryApi";
import type { ListParams, StatementType } from "../api/types";
import { inquiryQueryKeys } from "../queryKeys";

export const useInquirySummary = () =>
  useQuery({ queryKey: inquiryQueryKeys.summary(), queryFn: inquiryApi.summary });

export const useBalances = (params: ListParams = {}) =>
  useQuery({
    queryKey: inquiryQueryKeys.balances(params),
    queryFn: () => inquiryApi.balances(params),
    placeholderData: keepPreviousData,
  });

export const useTransactions = (params: ListParams = {}) =>
  useQuery({
    queryKey: inquiryQueryKeys.transactions(params),
    queryFn: () => inquiryApi.transactions(params),
    placeholderData: keepPreviousData,
  });

export const useLoans = (params: ListParams = {}) =>
  useQuery({
    queryKey: inquiryQueryKeys.loans(params),
    queryFn: () => inquiryApi.loans(params),
    placeholderData: keepPreviousData,
  });

/** Check a file, then load it. Loading refreshes every statement list and the summary. */
export const useStatementImport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, file, commit }: { type: StatementType; file: File; commit: boolean }) =>
      inquiryApi.imports.run(type, file, commit),
    onSuccess: (response) => {
      if (response.data.committed) {
        void queryClient.invalidateQueries({ queryKey: inquiryQueryKeys.all });
      }
    },
  });
};

export const useAnnouncements = () =>
  useQuery({ queryKey: inquiryQueryKeys.announcements(), queryFn: inquiryApi.announcements.list });

export const useAnnouncementMutations = () => {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: inquiryQueryKeys.announcements() });

  return {
    create: useMutation({
      mutationFn: (payload: AnnouncementPayload) => inquiryApi.announcements.create(payload),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: AnnouncementPayload }) =>
        inquiryApi.announcements.update(id, payload),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: inquiryApi.announcements.remove,
      onSuccess: refresh,
    }),
  };
};

export const useStationLookup = () =>
  useMutation({ mutationFn: (code: string) => inquiryApi.station.lookup(code) });
