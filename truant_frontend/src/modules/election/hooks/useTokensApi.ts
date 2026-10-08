import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { electionApi } from "../api/electionApi";
import type { ListParams } from "../api/types";
import { electionQueryKeys } from "../queryKeys";

export const useTokens = (params: ListParams = {}) =>
  useQuery({
    queryKey: electionQueryKeys.tokens.list(params),
    queryFn: () => electionApi.tokens.list(params),
    placeholderData: keepPreviousData,
  });

export const useTokenMutations = () => {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: electionQueryKeys.tokens.all() });

  return {
    lookup: useMutation({ mutationFn: electionApi.tokens.lookup }),
    create: useMutation({
      mutationFn: electionApi.tokens.create,
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: electionApi.tokens.remove,
      onSuccess: refresh,
    }),
  };
};
