import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { loanSettingsApi } from "../api/loanSettingsApi";

const key = ["loan", "settings"] as const;

export const useLoanSettings = (enabled = true) =>
  useQuery({ queryKey: key, queryFn: loanSettingsApi.get, enabled });

export const useLoanSettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loanSettingsApi.update,
    onSuccess: (response) => queryClient.setQueryData(key, response),
  });
};
