import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { loansApi } from "../api/loansApi";
import type { LoanStatus, RecordPaymentPayload } from "../types";

const root = ["loan", "loans"] as const;

export const useLoans = (params: { q?: string; status?: LoanStatus | ""; page: number; per_page: number }) =>
  useQuery({ queryKey: [...root, "list", params], queryFn: () => loansApi.list(params), placeholderData: keepPreviousData });

export const useLoan = (id: number, enabled = true) => useQuery({ queryKey: [...root, id], queryFn: () => loansApi.get(id), enabled });

export const useLoanActions = (id: number) => {
  const queryClient = useQueryClient();

  const accept = (response: Awaited<ReturnType<typeof loansApi.get>>) => {
    queryClient.setQueryData([...root, id], response);
    queryClient.invalidateQueries({ queryKey: [...root, "list"] });
  };

  return {
    record: useMutation({ mutationFn: (body: RecordPaymentPayload) => loansApi.recordPayment(id, body), onSuccess: accept }),
    voidPayment: useMutation({
      mutationFn: ({ paymentId, reason }: { paymentId: number; reason: string }) => loansApi.voidPayment(id, paymentId, reason),
      onSuccess: accept,
    }),
  };
};
