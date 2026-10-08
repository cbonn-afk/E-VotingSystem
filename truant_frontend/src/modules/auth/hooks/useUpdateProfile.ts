import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authQueryKeys } from "@/modules/auth/queryKeys";
import { authApi } from "@/modules/auth/services/authApi";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: FormData) => authApi.updateProfile(input),
    onSuccess: (user) => {
      queryClient.setQueryData(authQueryKeys.currentUser(), user);
    },
  });
};
