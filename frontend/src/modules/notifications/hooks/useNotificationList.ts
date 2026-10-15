import { useQuery } from "@tanstack/react-query";
import { notificationQueryKeys } from "@/modules/notifications/queryKeys";
import { notificationApi } from "@/modules/notifications/services/notificationApi";
import type { NotificationListParams } from "@/modules/notifications/types";

export const useNotificationList = (
  userId: number | undefined,
  params: NotificationListParams = {},
  enabled = true,
) =>
  useQuery({
    queryKey: notificationQueryKeys.list(userId ?? 0, params),
    queryFn: () => notificationApi.list(params),
    enabled: enabled && userId !== undefined,
  });
