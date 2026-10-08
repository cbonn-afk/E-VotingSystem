import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authApi } from "@/modules/auth/services/authApi";
import { authQueryKeys } from "@/modules/auth/queryKeys";
import { clearNotificationSession } from "@/modules/notifications/utils/notificationSession";

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (user) => {
      await clearNotificationSession(queryClient);
      queryClient.setQueryData(authQueryKeys.currentUser(), user);
    },
  });
};
