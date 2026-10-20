import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { loanApplicationsApi, type ApplicationAction } from "../api/loanApplicationsApi";
import type { ApplicationStatus, DecisionPayload, EvaluationPayload, LoanApplication, ReleasePayload } from "../types";

const root = ["loan", "applications"] as const;

export const useLoanApplications = (params: { q?: string; status?: ApplicationStatus | ""; page: number; per_page: number }) =>
  useQuery({
    queryKey: [...root, "list", params],
    queryFn: () => loanApplicationsApi.list(params),
    placeholderData: keepPreviousData,
  });

export const useLoanApplication = (id: number, enabled = true) =>
  useQuery({ queryKey: [...root, id], queryFn: () => loanApplicationsApi.get(id), enabled });

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
    evaluate: useMutation({
      mutationFn: (body: EvaluationPayload) => loanApplicationsApi.evaluate(id, body),
      onSuccess: accept,
    }),
    decide: useMutation({
      mutationFn: (body: DecisionPayload) => loanApplicationsApi.decide(id, body),
      onSuccess: accept,
    }),
    previewAgreement: useMutation({ mutationFn: (date: string) => loanApplicationsApi.previewAgreement(id, date) }),
    generateAgreement: useMutation({ mutationFn: (date: string) => loanApplicationsApi.generateAgreement(id, date), onSuccess: accept }),
    release: useMutation({ mutationFn: (body: ReleasePayload) => loanApplicationsApi.release(id, body), onSuccess: accept }),
  };
};
