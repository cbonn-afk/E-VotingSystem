import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authApi } from "@/modules/auth/services/authApi";
import { authQueryKeys } from "@/modules/auth/queryKeys";
import { clearNotificationSession } from "@/modules/notifications/utils/notificationSession";

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onMutate: async () => {
      await clearNotificationSession(queryClient);
    },
    onSuccess: async () => {
      queryClient.clear();
      queryClient.setQueryData(authQueryKeys.currentUser(), null);
    },
  });
};
