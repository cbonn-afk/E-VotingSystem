import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { loanApplicationsApi, type ApplicationAction } from "../api/loanApplicationsApi";
import type { ApplicationStatus, LoanApplication } from "../types";

const root = ["loan", "applications"] as const;

export const useLoanApplications = (params: { q?: string; status?: ApplicationStatus | ""; page: number; per_page: number }) =>
  useQuery({
    queryKey: [...root, "list", params],
    queryFn: () => loanApplicationsApi.list(params),
    placeholderData: keepPreviousData,
  });

export const useLoanApplication = (id: number) =>
  useQuery({ queryKey: [...root, id], queryFn: () => loanApplicationsApi.get(id) });

export const useLoanApplicationActions = (id: number) => {
  const queryClient = useQueryClient();

  const accept = (response: { data: LoanApplication }) => {
    queryClient.setQueryData([...root, id], response);
    queryClient.invalidateQueries({ queryKey: [...root, "list"] });
  };

  return {
    transition: useMutation({
      mutationFn: ({ action, remarks }: { action: ApplicationAction; remarks?: string }) =>
        loanApplicationsApi.transition(id, action, remarks),
      onSuccess: accept,
    }),
    reviewDocument: useMutation({
      mutationFn: ({ documentId, status, remarks }: { documentId: number; status: "accepted" | "rejected"; remarks?: string }) =>
        loanApplicationsApi.reviewDocument(id, documentId, status, remarks),
      onSuccess: accept,
    }),
  };
};
