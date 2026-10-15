import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { accountingApi } from "../api/accountingApi";
import type {
  AccountPayload,
  AccountingDefaultsPayload,
  FiscalYearPayload,
  FiscalYearUpdatePayload,
  FundSourcePayload,
  JournalEntryPayload,
  ListParams,
  ReverseJournalPayload,
  TaxPayload,
  TransactionSeriesPayload,
} from "../api/types";
import { accountingQueryKeys } from "../queryKeys";

// ─── Queries ────────────────────────────────────────────────────────────────
export const useAccounts = (params: ListParams = {}) =>
  useQuery({
    queryKey: accountingQueryKeys.accounts.list(params),
    queryFn: () => accountingApi.accounts.list(params),
    placeholderData: keepPreviousData,
  });

export const useAccount = (id: string) =>
  useQuery({
    queryKey: accountingQueryKeys.accounts.detail(id),
    queryFn: () => accountingApi.accounts.get(id),
    enabled: Boolean(id),
  });

export const useAccountsTree = (params: ListParams = {}, enabled = true) =>
  useQuery({
    queryKey: accountingQueryKeys.accounts.tree(params),
    queryFn: () => accountingApi.accounts.tree(params),
    enabled,
    placeholderData: keepPreviousData,
  });

export const useAccountStats = () =>
  useQuery({
    queryKey: accountingQueryKeys.accounts.stats(),
    queryFn: accountingApi.accounts.stats,
  });

export const useAccountTypes = () =>
  useQuery({
    queryKey: accountingQueryKeys.accountTypes(),
    queryFn: accountingApi.accountTypes.list,
  });

export const useDetailTypes = (accountTypeId: number | null) =>
  useQuery({
    queryKey: accountingQueryKeys.detailTypes(accountTypeId),
    queryFn: () =>
      accountingApi.accountTypes.detailTypes(accountTypeId as number),
    enabled: Boolean(accountTypeId),
  });

export const useFiscalYears = (params: ListParams = {}) =>
  useQuery({
    queryKey: accountingQueryKeys.fiscalYears.list(params),
    queryFn: () => accountingApi.fiscalYears.list(params),
  });

export const usePeriods = (params: ListParams = {}) =>
  useQuery({
    queryKey: accountingQueryKeys.periods.list(params),
    queryFn: () => accountingApi.periods.list(params),
  });

export const useTaxes = (params: ListParams = {}) =>
  useQuery({
    queryKey: accountingQueryKeys.taxes.list(params),
    queryFn: () => accountingApi.taxes.list(params),
  });

export const useFundSources = (params: ListParams = {}) =>
  useQuery({
    queryKey: accountingQueryKeys.fundSources.list(params),
    queryFn: () => accountingApi.fundSources.list(params),
  });

export const useTransactionSeries = (params: ListParams = {}) =>
  useQuery({
    queryKey: accountingQueryKeys.transactionSeries.list(params),
    queryFn: () => accountingApi.transactionSeries.list(params),
  });

export const useJournals = (params: ListParams = {}) =>
  useQuery({
    queryKey: accountingQueryKeys.journals.list(params),
    queryFn: () => accountingApi.journals.list(params),
    placeholderData: keepPreviousData,
  });

export const useAccountingEvents = (params: ListParams = {}) =>
  useQuery({
    queryKey: accountingQueryKeys.events.list(params),
    queryFn: () => accountingApi.events.list(params),
    placeholderData: keepPreviousData,
  });

export const useAccountingEvent = (id: string) =>
  useQuery({
    queryKey: accountingQueryKeys.events.detail(id),
    queryFn: () => accountingApi.events.get(id),
    enabled: Boolean(id),
  });

export const useJournal = (id: string) =>
  useQuery({
    queryKey: accountingQueryKeys.journals.detail(id),
    queryFn: () => accountingApi.journals.get(id),
    enabled: Boolean(id),
  });

export const useAccountingDefaults = () =>
  useQuery({
    queryKey: accountingQueryKeys.defaults(),
    queryFn: accountingApi.defaults.get,
  });

export const useTrialBalance = (params: ListParams, enabled = true) =>
  useQuery({
    queryKey: accountingQueryKeys.reports.trialBalance(params),
    queryFn: () => accountingApi.reports.trialBalance(params),
    enabled: enabled && Boolean(params.date),
  });

export const useIncomeStatement = (params: ListParams, enabled = true) =>
  useQuery({
    queryKey: accountingQueryKeys.reports.incomeStatement(params),
    queryFn: () => accountingApi.reports.incomeStatement(params),
    enabled: enabled && Boolean(params.from) && Boolean(params.to),
    // Keep showing the previous results while a search/filter change refetches,
    // instead of flashing a full-page "Loading…" on every keystroke.
    placeholderData: keepPreviousData,
  });

export const useIncomeExpenseReport = (params: ListParams, enabled = true) =>
  useQuery({
    queryKey: accountingQueryKeys.reports.incomeExpenses(params),
    queryFn: () => accountingApi.reports.incomeExpenses(params),
    enabled: enabled && Boolean(params.from) && Boolean(params.to),
    placeholderData: keepPreviousData,
  });

export const useCashFlow = (params: ListParams, enabled = true) =>
  useQuery({
    queryKey: accountingQueryKeys.reports.cashFlow(params),
    queryFn: () => accountingApi.reports.cashFlow(params),
    enabled: enabled && Boolean(params.from) && Boolean(params.to),
    placeholderData: keepPreviousData,
  });

export const useBalanceSheet = (params: ListParams, enabled = true) =>
  useQuery({
    queryKey: accountingQueryKeys.reports.balanceSheet(params),
    queryFn: () => accountingApi.reports.balanceSheet(params),
    enabled: enabled && Boolean(params.date),
  });

export const useGeneralLedger = (params: ListParams, enabled = true) =>
  useQuery({
    queryKey: accountingQueryKeys.reports.generalLedger(params),
    queryFn: () => accountingApi.reports.generalLedger(params),
    enabled: enabled && Boolean(params.to),
  });

// ─── Invalidation ─────────────────────────────────────────────────────────--
const useInvalidation = () => {
  const queryClient = useQueryClient();

  return {
    accounts: () =>
      queryClient.invalidateQueries({
        queryKey: accountingQueryKeys.accounts.all(),
      }),
    journals: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: accountingQueryKeys.journals.all(),
        }),
        queryClient.invalidateQueries({
          queryKey: accountingQueryKeys.reports.all(),
        }),
      ]);
    },
    events: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: accountingQueryKeys.events.all(),
        }),
        queryClient.invalidateQueries({
          queryKey: accountingQueryKeys.journals.all(),
        }),
        queryClient.invalidateQueries({
          queryKey: accountingQueryKeys.reports.all(),
        }),
      ]);
    },
    periods: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: accountingQueryKeys.periods.all(),
        }),
        queryClient.invalidateQueries({
          queryKey: accountingQueryKeys.fiscalYears.all(),
        }),
      ]),
    taxes: () =>
      queryClient.invalidateQueries({
        queryKey: accountingQueryKeys.taxes.all(),
      }),
    fundSources: () =>
      queryClient.invalidateQueries({
        queryKey: accountingQueryKeys.fundSources.all(),
      }),
    transactionSeries: () =>
      queryClient.invalidateQueries({
        queryKey: accountingQueryKeys.transactionSeries.all(),
      }),
    defaults: () =>
      queryClient.invalidateQueries({
        queryKey: accountingQueryKeys.defaults(),
      }),
  };
};

// ─── Mutations ──────────────────────────────────────────────────────────────
export const useCreateAccount = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: (payload: AccountPayload) =>
      accountingApi.accounts.create(payload),
    onSuccess: () => invalidate.accounts(),
  });
};

export const useUpdateAccount = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<AccountPayload>;
    }) => accountingApi.accounts.update(id, payload),
    onSuccess: () => invalidate.accounts(),
  });
};

export const useDeleteAccount = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: (id: string) => accountingApi.accounts.remove(id),
    onSuccess: () => invalidate.accounts(),
  });
};

export const useCreateJournal = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: (payload: JournalEntryPayload) =>
      accountingApi.journals.create(payload),
    onSuccess: () => invalidate.journals(),
  });
};

export const useUpdateJournal = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: JournalEntryPayload;
    }) => accountingApi.journals.update(id, payload),
    onSuccess: () => invalidate.journals(),
  });
};

export const useDeleteJournal = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: (id: string) => accountingApi.journals.remove(id),
    onSuccess: () => invalidate.journals(),
  });
};

export const usePostJournal = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: (id: string) => accountingApi.journals.post(id),
    onSuccess: () => invalidate.journals(),
  });
};

export const useReverseJournal = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ReverseJournalPayload;
    }) => accountingApi.journals.reverse(id, payload),
    onSuccess: () => invalidate.journals(),
  });
};

export const useVoidJournal = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string | null }) =>
      accountingApi.journals.void(id, reason),
    onSuccess: () => invalidate.journals(),
  });
};

export const useRetryAccountingEvent = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: (id: string) => accountingApi.events.retry(id),
    onSuccess: () => invalidate.events(),
  });
};

export const useCreateFiscalYear = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: (payload: FiscalYearPayload) =>
      accountingApi.fiscalYears.create(payload),
    onSuccess: () => invalidate.periods(),
  });
};

export const useSetCurrentFiscalYear = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: (id: string) => accountingApi.fiscalYears.setCurrent(id),
    onSuccess: () => invalidate.periods(),
  });
};

export const useUpdateFiscalYear = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: FiscalYearUpdatePayload;
    }) => accountingApi.fiscalYears.update(id, payload),
    onSuccess: () => invalidate.periods(),
  });
};

export const useDeleteFiscalYear = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: (id: string) => accountingApi.fiscalYears.remove(id),
    onSuccess: () => invalidate.periods(),
  });
};

export const useUpdatePeriodStatus = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      accountingApi.periods.updateStatus(id, status),
    onSuccess: () => invalidate.periods(),
  });
};

export const useCreateTax = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: (payload: TaxPayload) => accountingApi.taxes.create(payload),
    onSuccess: () => invalidate.taxes(),
  });
};

export const useUpdateTax = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<TaxPayload>;
    }) => accountingApi.taxes.update(id, payload),
    onSuccess: () => invalidate.taxes(),
  });
};

export const useDeleteTax = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: (id: string) => accountingApi.taxes.remove(id),
    onSuccess: () => invalidate.taxes(),
  });
};

export const useCreateFundSource = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: (payload: FundSourcePayload) =>
      accountingApi.fundSources.create(payload),
    onSuccess: () => invalidate.fundSources(),
  });
};

export const useUpdateFundSource = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<FundSourcePayload>;
    }) => accountingApi.fundSources.update(id, payload),
    onSuccess: () => invalidate.fundSources(),
  });
};

export const useDeleteFundSource = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: (id: string) => accountingApi.fundSources.remove(id),
    onSuccess: () => invalidate.fundSources(),
  });
};

export const useCreateTransactionSeries = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: (payload: TransactionSeriesPayload) =>
      accountingApi.transactionSeries.create(payload),
    onSuccess: () => invalidate.transactionSeries(),
  });
};

export const useUpdateTransactionSeries = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<TransactionSeriesPayload>;
    }) => accountingApi.transactionSeries.update(id, payload),
    onSuccess: () => invalidate.transactionSeries(),
  });
};

export const useDeleteTransactionSeries = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: (id: string) => accountingApi.transactionSeries.remove(id),
    onSuccess: () => invalidate.transactionSeries(),
  });
};

export const useUpdateAccountingDefaults = () => {
  const invalidate = useInvalidation();

  return useMutation({
    mutationFn: (payload: AccountingDefaultsPayload) =>
      accountingApi.defaults.update(payload),
    onSuccess: () => invalidate.defaults(),
  });
};
