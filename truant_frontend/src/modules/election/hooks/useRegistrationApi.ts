import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { electionApi } from "../api/electionApi";
import type { ListParams } from "../api/types";
import { electionQueryKeys } from "../queryKeys";

export const useRegistrations = (params: ListParams = {}) =>
  useQuery({
    queryKey: electionQueryKeys.registrations.list(params),
    queryFn: () => electionApi.registrations.list(params),
    placeholderData: keepPreviousData,
  });

export const useRegistrationMutations = () => {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: electionQueryKeys.registrations.all(),
    });

  return {
    lookup: useMutation({ mutationFn: electionApi.registrations.lookup }),
    create: useMutation({
      mutationFn: electionApi.registrations.create,
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: electionApi.registrations.remove,
      onSuccess: refresh,
    }),
  };
};
