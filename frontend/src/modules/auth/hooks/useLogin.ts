import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authApi } from "@/modules/auth/services/authApi";
import { authQueryKeys } from "@/modules/auth/queryKeys";

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (user) => {
      queryClient.clear();
      queryClient.setQueryData(authQueryKeys.currentUser(), user);
    },
  });
};
