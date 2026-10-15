import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ChangePasswordRequest } from "@/modules/auth/schemas/changePasswordSchema";
import { authQueryKeys } from "@/modules/auth/queryKeys";
import { authApi } from "@/modules/auth/services/authApi";

export const useChangePassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ChangePasswordRequest) => authApi.changePassword(input),
    onSuccess: (user) => {
      queryClient.setQueryData(authQueryKeys.currentUser(), user);
    },
  });
};
