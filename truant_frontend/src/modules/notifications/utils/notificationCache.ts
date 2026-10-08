import type { QueryClient, QueryKey } from "@tanstack/react-query";

import { notificationQueryKeys } from "../queryKeys";
import type {
  NotificationListParams,
  NotificationListResponse,
  UnreadNotificationCountResponse,
} from "../types";

export type NotificationCacheSnapshot = {
  lists: Array<[QueryKey, NotificationListResponse | undefined]>;
  unreadCount: UnreadNotificationCountResponse | undefined;
};

const listParamsFromKey = (queryKey: QueryKey): NotificationListParams => {
  const params = queryKey.at(-1);

  return typeof params === "object" && params !== null
    ? (params as NotificationListParams)
    : {};
};

const withoutNotification = (
  response: NotificationListResponse,
  notificationId: string,
): NotificationListResponse => {
  const data = response.data.filter(
    (notification) => notification.id !== notificationId,
  );
  const removed = response.data.length - data.length;

  if (removed === 0) return response;

  return {
    ...response,
    data,
    meta: {
      ...response.meta,
      from: data.length === 0 ? null : response.meta.from,
      to:
        response.meta.to === null
          ? null
          : Math.max(response.meta.from ?? 0, response.meta.to - removed),
      total: Math.max(0, response.meta.total - removed),
    },
  };
};

export const snapshotNotificationCache = (
  queryClient: QueryClient,
  userId: number,
): NotificationCacheSnapshot => ({
  lists: queryClient.getQueriesData<NotificationListResponse>({
    queryKey: notificationQueryKeys.lists(userId),
  }),
  unreadCount: queryClient.getQueryData<UnreadNotificationCountResponse>(
    notificationQueryKeys.unreadCount(userId),
  ),
});

export const restoreNotificationCache = (
  queryClient: QueryClient,
  userId: number,
  snapshot: NotificationCacheSnapshot,
): void => {
  snapshot.lists.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
  queryClient.setQueryData(
    notificationQueryKeys.unreadCount(userId),
    snapshot.unreadCount,
  );
};

export const markNotificationReadInCache = (
  queryClient: QueryClient,
  userId: number,
  notificationId: string,
): void => {
  queryClient
    .getQueriesData<NotificationListResponse>({
      queryKey: notificationQueryKeys.lists(userId),
    })
    .forEach(([queryKey, current]) => {
      if (!current) return;

      if (listParamsFromKey(queryKey).status === "unread") {
        queryClient.setQueryData(
          queryKey,
          withoutNotification(current, notificationId),
        );

        return;
      }

      queryClient.setQueryData(queryKey, {
        ...current,
        data: current.data.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                is_read: true,
                read_at: notification.read_at ?? new Date().toISOString(),
              }
            : notification,
        ),
      });
    });

  queryClient.setQueryData<UnreadNotificationCountResponse>(
    notificationQueryKeys.unreadCount(userId),
    (current) =>
      current
        ? {
            data: {
              count: Math.max(0, current.data.count - 1),
            },
          }
        : current,
  );
};

export const markAllNotificationsReadInCache = (
  queryClient: QueryClient,
  userId: number,
): void => {
  queryClient
    .getQueriesData<NotificationListResponse>({
      queryKey: notificationQueryKeys.lists(userId),
    })
    .forEach(([queryKey, current]) => {
      if (!current) return;

      if (listParamsFromKey(queryKey).status === "unread") {
        queryClient.setQueryData(queryKey, {
          ...current,
          data: [],
          meta: {
            ...current.meta,
            from: null,
            to: null,
            total: 0,
          },
        });

        return;
      }

      const readAt = new Date().toISOString();

      queryClient.setQueryData(queryKey, {
        ...current,
        data: current.data.map((notification) => ({
          ...notification,
          is_read: true,
          read_at: notification.read_at ?? readAt,
        })),
      });
    });

  queryClient.setQueryData<UnreadNotificationCountResponse>(
    notificationQueryKeys.unreadCount(userId),
    (current) => (current ? { data: { count: 0 } } : current),
  );
};

export const archiveNotificationInCache = (
  queryClient: QueryClient,
  userId: number,
  notificationId: string,
): void => {
  const wasUnread = queryClient
    .getQueriesData<NotificationListResponse>({
      queryKey: notificationQueryKeys.lists(userId),
    })
    .flatMap(([, response]) => response?.data ?? [])
    .some((item) => item.id === notificationId && !item.is_read);

  queryClient
    .getQueriesData<NotificationListResponse>({
      queryKey: notificationQueryKeys.lists(userId),
    })
    .forEach(([queryKey, current]) => {
      if (!current) return;

      queryClient.setQueryData(
        queryKey,
        withoutNotification(current, notificationId),
      );
    });

  queryClient.setQueryData<UnreadNotificationCountResponse>(
    notificationQueryKeys.unreadCount(userId),
    (current) =>
      current && wasUnread
        ? {
            data: {
              count: Math.max(0, current.data.count - 1),
            },
          }
        : current,
  );
};

export const clearNotificationsInCache = (
  queryClient: QueryClient,
  userId: number,
): void => {
  queryClient
    .getQueriesData<NotificationListResponse>({
      queryKey: notificationQueryKeys.lists(userId),
    })
    .forEach(([queryKey, current]) => {
      if (!current) return;

      queryClient.setQueryData(queryKey, {
        ...current,
        data: [],
        meta: {
          ...current.meta,
          from: null,
          to: null,
          total: 0,
        },
      });
    });

  queryClient.setQueryData<UnreadNotificationCountResponse>(
    notificationQueryKeys.unreadCount(userId),
    (current) => (current ? { data: { count: 0 } } : current),
  );
};
