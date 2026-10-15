import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { loanProductsApi } from "../api/loanProductsApi";
import type { LoanProductPayload } from "../types";

const key = ["loan", "products"] as const;

export const useLoanProducts = (params: { q?: string; page: number; per_page: number }) =>
  useQuery({
    queryKey: [...key, params],
    queryFn: () => loanProductsApi.list(params),
    placeholderData: keepPreviousData,
  });

export const useSaveLoanProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: number | null; body: LoanProductPayload }) =>
      id === null ? loanProductsApi.create(body) : loanProductsApi.update(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
};
