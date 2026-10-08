import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { electionApi } from "../api/electionApi";
import type { ElectionSettingsPayload } from "../api/types";
import { electionQueryKeys } from "../queryKeys";

export const useElectionSettings = () =>
  useQuery({
    queryKey: electionQueryKeys.settings(),
    queryFn: electionApi.settings.get,
    staleTime: 60_000,
  });

export const useElectionSettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ElectionSettingsPayload) =>
      electionApi.settings.update(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: electionQueryKeys.settings() }),
  });
};
