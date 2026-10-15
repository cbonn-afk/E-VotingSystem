import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { accountingApi } from "../api/accountingApi";
import type { ExpensePaymentPayload, ListParams } from "../api/types";
import { accountingQueryKeys } from "../queryKeys";

export const useBills = (params: ListParams = {}) =>
  useQuery({
    queryKey: accountingQueryKeys.bills.list(params),
    queryFn: () => accountingApi.bills.list(params),
    placeholderData: keepPreviousData,
  });

export const useBill = (id: string) =>
  useQuery({
    queryKey: accountingQueryKeys.bills.detail(id),
    queryFn: () => accountingApi.bills.get(id),
    enabled: Boolean(id),
  });

export const useBillMutations = () => {
  const queryClient = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: accountingQueryKeys.bills.all(),
      }),
      queryClient.invalidateQueries({
        queryKey: accountingQueryKeys.vendors.all(),
      }),
      queryClient.invalidateQueries({
        queryKey: accountingQueryKeys.expenses.all(),
      }),
      queryClient.invalidateQueries({
        queryKey: accountingQueryKeys.journals.all(),
      }),
      queryClient.invalidateQueries({
        queryKey: accountingQueryKeys.reports.all(),
      }),
    ]);
  };

  return {
    recordPayment: useMutation({
      mutationFn: ({
        expenseId,
        payload,
      }: {
        expenseId: string;
        payload: ExpensePaymentPayload;
      }) => accountingApi.expenses.payments.create(expenseId, payload),
      onSuccess: refresh,
    }),
    postBill: useMutation({
      mutationFn: (id: string) => accountingApi.expenses.post(id),
      onSuccess: refresh,
    }),
    deleteBill: useMutation({
      mutationFn: (id: string) => accountingApi.expenses.remove(id),
      onSuccess: refresh,
    }),
    voidBill: useMutation({
      mutationFn: ({ id, reason }: { id: string; reason: string }) =>
        accountingApi.expenses.void(id, reason),
      onSuccess: refresh,
    }),
    voidPayment: useMutation({
      mutationFn: ({
        expenseId,
        paymentId,
        reason,
      }: {
        expenseId: string;
        paymentId: string;
        reason: string;
      }) => accountingApi.expenses.payments.void(expenseId, paymentId, reason),
      onSuccess: refresh,
    }),
  };
};
