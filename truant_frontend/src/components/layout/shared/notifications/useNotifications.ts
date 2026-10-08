"use client";

import { useMemo } from "react";

import { canViewerSeeNotification } from "./notificationUtils";
import type { HeaderNotification, NotificationDropdownProps } from "./types";

type UseNotificationsOptions = Pick<
  NotificationDropdownProps,
  | "notifications"
  | "viewer"
  | "onNotificationRead"
  | "onNotificationArchive"
  | "onAllNotificationsRead"
  | "onNotificationsClear"
>;

export const useNotifications = ({
  notifications,
  viewer,
  onNotificationRead,
  onNotificationArchive,
  onAllNotificationsRead,
  onNotificationsClear,
}: UseNotificationsOptions) => {
  const visibleNotifications = useMemo(
    () =>
      notifications.filter((notification) =>
        canViewerSeeNotification(notification, viewer),
      ),
    [notifications, viewer],
  );

  const markAsRead = (notification: HeaderNotification) => {
    if (notification.read) return;

    onNotificationRead?.(notification.id, false);
  };

  const markAllAsRead = () => {
    const visibleIds = visibleNotifications
      .filter((notification) => !notification.read)
      .map((notification) => notification.id);

    onAllNotificationsRead?.(visibleIds);
  };

  const archive = (notification: HeaderNotification) => {
    onNotificationArchive?.(notification.id);
  };

  const clear = () => {
    if (visibleNotifications.length === 0) return;

    onNotificationsClear?.();
  };

  return {
    visibleNotifications,
    markAsRead,
    markAllAsRead,
    archive,
    clear,
  };
};
