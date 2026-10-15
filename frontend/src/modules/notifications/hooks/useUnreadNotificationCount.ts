import { useQuery } from "@tanstack/react-query";
import { notificationApi } from "@/modules/notifications/services/notificationApi";
import { notificationQueryKeys } from "@/modules/notifications/queryKeys";

export const useUnreadNotificationCount = (
  userId: number | undefined,
  enabled = true,
) =>
  useQuery({
    queryKey: notificationQueryKeys.unreadCount(userId ?? 0),
    queryFn: () => notificationApi.unreadCount(),
    enabled: enabled && userId !== undefined,
  });
