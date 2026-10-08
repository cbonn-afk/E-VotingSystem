import type { NotificationListParams } from "./types";

export const notificationQueryKeys = {
  all: ["notifications"] as const,

  user: (userId: number) => [...notificationQueryKeys.all, userId] as const,

  lists: (userId: number) =>
    [...notificationQueryKeys.user(userId), "list"] as const,

  list: (userId: number, params: NotificationListParams = {}) =>
    [...notificationQueryKeys.lists(userId), params] as const,

  unreadCount: (userId: number) =>
    [...notificationQueryKeys.user(userId), "unread-count"] as const,
};
