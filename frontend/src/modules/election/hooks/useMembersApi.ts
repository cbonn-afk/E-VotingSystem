import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { electionApi } from "../api/electionApi";
import type { ListParams, MemberPayload } from "../api/types";
import { electionQueryKeys } from "../queryKeys";

export const useMembers = (params: ListParams = {}) =>
  useQuery({
    queryKey: electionQueryKeys.members.list(params),
    queryFn: () => electionApi.members.list(params),
    placeholderData: keepPreviousData,
  });

export const useMemberMutations = () => {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: electionQueryKeys.members.all() });

  return {
    create: useMutation({
      mutationFn: (payload: MemberPayload) =>
        electionApi.members.create(payload),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: number;
        payload: Partial<MemberPayload>;
      }) => electionApi.members.update(id, payload),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: electionApi.members.remove,
      onSuccess: refresh,
    }),
    importFile: useMutation({
      mutationFn: electionApi.members.import,
      onSuccess: refresh,
    }),
  };
};
