import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { approvalLevelsApi } from "../api/approvalLevelsApi";

const key = ["loan", "approval-levels"] as const;

export const useApprovalLevels = () => useQuery({ queryKey: key, queryFn: approvalLevelsApi.get });

export const useSaveApprovalLevels = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approvalLevelsApi.update,
    onSuccess: (response) => queryClient.setQueryData(key, response),
  });
};
