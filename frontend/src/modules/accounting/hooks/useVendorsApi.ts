import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { accountingApi } from "../api/accountingApi";
import type { ListParams, VendorPayload } from "../api/types";
import { accountingQueryKeys } from "../queryKeys";

export const useVendors = (params: ListParams = {}) =>
  useQuery({
    queryKey: accountingQueryKeys.vendors.list(params),
    queryFn: () => accountingApi.vendors.list(params),
    placeholderData: keepPreviousData,
  });

export const useVendor = (id: string) =>
  useQuery({
    queryKey: accountingQueryKeys.vendors.detail(id),
    queryFn: () => accountingApi.vendors.get(id),
    enabled: Boolean(id),
  });

export const useVendorMutations = () => {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: accountingQueryKeys.vendors.all(),
    });

  return {
    create: useMutation({
      mutationFn: (payload: VendorPayload) =>
        accountingApi.vendors.create(payload),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: Partial<VendorPayload>;
      }) => accountingApi.vendors.update(id, payload),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: accountingApi.vendors.remove,
      onSuccess: refresh,
    }),
  };
};
