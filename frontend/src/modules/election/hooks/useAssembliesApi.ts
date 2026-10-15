import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { electionApi } from "../api/electionApi";
import type { AssemblyPayload, AssemblyStatus } from "../api/types";
import { electionQueryKeys } from "../queryKeys";

export const useAssemblies = () =>
  useQuery({
    queryKey: electionQueryKeys.assemblies.list(),
    queryFn: electionApi.assemblies.list,
  });

export const useCurrentAssembly = () =>
  useQuery({
    queryKey: electionQueryKeys.assemblies.current(),
    queryFn: electionApi.assemblies.current,
  });

export const useAssemblyMutations = () => {
  const queryClient = useQueryClient();
  // Status changes affect almost every election screen, so refresh them all.
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: electionQueryKeys.all });

  return {
    create: useMutation({
      mutationFn: (payload: AssemblyPayload) =>
        electionApi.assemblies.create(payload),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ id, name }: { id: number; name: string }) =>
        electionApi.assemblies.update(id, { name }),
      onSuccess: refresh,
    }),
    updateStatus: useMutation({
      mutationFn: ({ id, status }: { id: number; status: AssemblyStatus }) =>
        electionApi.assemblies.updateStatus(id, status),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: electionApi.assemblies.remove,
      onSuccess: refresh,
    }),
  };
};
