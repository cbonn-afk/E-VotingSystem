import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authApi } from "@/modules/auth/services/authApi";
import { authQueryKeys } from "@/modules/auth/queryKeys";

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: async () => {
      queryClient.clear();
      queryClient.setQueryData(authQueryKeys.currentUser(), null);
    },
  });
};
