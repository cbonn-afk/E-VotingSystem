import type { QueryClient } from "@tanstack/react-query";

import { resetEchoClient } from "@/libs/realtime/echoClient";

import { notificationQueryKeys } from "../queryKeys";

export const clearNotificationSession = async (
  queryClient: QueryClient,
): Promise<void> => {
  await queryClient.cancelQueries({
    queryKey: notificationQueryKeys.all,
  });
  queryClient.removeQueries({
    queryKey: notificationQueryKeys.all,
  });
  await resetEchoClient();
};
