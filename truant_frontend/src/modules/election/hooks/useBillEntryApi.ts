import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { accountingApi } from "../api/accountingApi";
import type { ExpensePayload } from "../api/types";
import { accountingQueryKeys } from "../queryKeys";

export const useBillCategories = () =>
  useQuery({
    queryKey: accountingQueryKeys.expenses.categories(),
    queryFn: accountingApi.expenses.categories,
  });

export const useBillPaymentAccounts = () =>
  useQuery({
    queryKey: accountingQueryKeys.expenses.paymentAccounts(),
    queryFn: accountingApi.expenses.paymentAccounts,
  });

export const useBillPayableAccounts = () =>
  useQuery({
    queryKey: accountingQueryKeys.expenses.payableAccounts(),
    queryFn: accountingApi.expenses.payableAccounts,
  });

export const useCreateBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExpensePayload) =>
      accountingApi.expenses.create(payload),
    onSuccess: async (response) => {
      queryClient.setQueryData(
        accountingQueryKeys.expenses.detail(response.data.id),
        response,
      );
      await queryClient.invalidateQueries({
        queryKey: accountingQueryKeys.expenses.all(),
      });
      if (response.data.status === "posted") {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: accountingQueryKeys.journals.all(),
          }),
          queryClient.invalidateQueries({
            queryKey: accountingQueryKeys.reports.all(),
          }),
        ]);
      }
    },
  });
};

export const useUpdateBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ExpensePayload>;
    }) => accountingApi.expenses.update(id, payload),
    onSuccess: async (response) => {
      queryClient.setQueryData(
        accountingQueryKeys.expenses.detail(response.data.id),
        response,
      );
      queryClient.setQueryData(
        accountingQueryKeys.bills.detail(response.data.id),
        response,
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: accountingQueryKeys.expenses.all(),
        }),
        queryClient.invalidateQueries({
          queryKey: accountingQueryKeys.bills.all(),
        }),
      ]);
    },
  });
};

export const useUploadBillReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, receipt }: { id: string; receipt: File }) =>
      accountingApi.expenses.uploadReceipt(id, receipt),
    onSuccess: (response) => {
      queryClient.setQueryData(
        accountingQueryKeys.expenses.detail(response.data.id),
        response,
      );
      queryClient.invalidateQueries({
        queryKey: accountingQueryKeys.expenses.all(),
      });
    },
  });
};

export const useUploadExpenseDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, document }: { id: string; document: File }) =>
      accountingApi.expenses.uploadDocument(id, document),
    onSuccess: (response) => {
      queryClient.setQueryData(
        accountingQueryKeys.expenses.detail(response.data.id),
        response,
      );
      queryClient.invalidateQueries({
        queryKey: accountingQueryKeys.expenses.all(),
      });
    },
  });
};
