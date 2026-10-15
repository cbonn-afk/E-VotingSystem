"use client";

import { useMemo, useState } from "react";
import { toast } from "react-toastify";

import NotificationDropdown from "./NotificationDropdown";

import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";
import { useArchiveNotification } from "@/modules/notifications/hooks/useArchiveNotification";
import { useClearNotifications } from "@/modules/notifications/hooks/useClearNotifications";
import { useMarkAllNotificationsRead } from "@/modules/notifications/hooks/useMarkAllNotificationsRead";
import { useMarkNotificationRead } from "@/modules/notifications/hooks/useMarkNotificationRead";
import { useNotificationList } from "@/modules/notifications/hooks/useNotificationList";
import { useUnreadNotificationCount } from "@/modules/notifications/hooks/useUnreadNotificationCount";
import { mapNotificationToHeader } from "@/modules/notifications/utils/mapNotification";
import { useNotificationSubscription } from "@/modules/notifications/hooks/useNotificationSubscription";
import type { NotificationTab } from "./notifications/types";

const HeaderNotifications = () => {
  const currentUser = useCurrentUser();
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const userId = currentUser.data?.id;

  useNotificationSubscription(userId, {
    onNotification: (notification) => {
      toast.info(notification.title);
    },
    onConnectionError: () => {
      toast.error("Realtime notifications could not connect.");
    },
  });

  const markNotificationRead = useMarkNotificationRead(userId);
  const markAllNotificationsRead = useMarkAllNotificationsRead(userId);
  const archiveNotification = useArchiveNotification(userId);
  const clearNotifications = useClearNotifications(userId);
  const isAuthenticated = Boolean(currentUser.data);

  const unreadCount = useUnreadNotificationCount(userId, isAuthenticated);
  const notificationsList = useNotificationList(
    userId,
    {
      status: activeTab,
      page: 1,
      per_page: 20,
    },
    isAuthenticated,
  );

  const notifications = useMemo(
    () => notificationsList.data?.data.map(mapNotificationToHeader) ?? [],
    [notificationsList.data?.data],
  );
  const displayedUnreadCount =
    unreadCount.data?.data.count ??
    notifications.filter((notification) => !notification.read).length;

  const emptyMessage = notificationsList.isError
    ? "Notifications could not be loaded."
    : notificationsList.isPending
      ? "Loading notifications..."
      : "You have no notifications right now.";

  const viewer = useMemo(
    () => ({
      name: currentUser.data?.name,
      permissions: currentUser.data?.permissions ?? [],
      modules: currentUser.data?.modules ?? [],
      isSuperAdmin: currentUser.data?.is_super_admin ?? false,
    }),
    [currentUser.data],
  );

  return (
    <NotificationDropdown
      notifications={notifications}
      viewer={viewer}
      activeTab={activeTab}
      unreadCount={displayedUnreadCount}
      isLoading={notificationsList.isPending}
      isError={notificationsList.isError}
      isMarkingAllRead={markAllNotificationsRead.isPending}
      isClearingNotifications={clearNotifications.isPending}
      readingNotificationId={
        markNotificationRead.isPending
          ? markNotificationRead.variables?.notificationId
          : undefined
      }
      archivingNotificationId={
        archiveNotification.isPending
          ? archiveNotification.variables?.notificationId
          : undefined
      }
      onTabChange={setActiveTab}
      emptyMessage={emptyMessage}
      onRetry={() => {
        void Promise.all([notificationsList.refetch(), unreadCount.refetch()]);
      }}
      onNotificationRead={(notificationId, isRead) => {
        if (
          markNotificationRead.isPending &&
          markNotificationRead.variables?.notificationId === notificationId
        ) {
          return;
        }

        markNotificationRead.mutate(
          { notificationId, isRead },
          {
            onError: () => {
              toast.error("The notification could not be marked as read.");
            },
          },
        );
      }}
      onNotificationArchive={(notificationId) => {
        if (
          archiveNotification.isPending &&
          archiveNotification.variables?.notificationId === notificationId
        ) {
          return;
        }

        archiveNotification.mutate(
          { notificationId },
          {
            onSuccess: () => {
              toast.success("Notification archived.");
            },
            onError: () => {
              toast.error("The notification could not be archived.");
            },
          },
        );
      }}
      onAllNotificationsRead={() => {
        markAllNotificationsRead.mutate(undefined, {
          onSuccess: () => {
            toast.success("All notifications marked as read.");
          },
          onError: () => {
            toast.error("Notifications could not be updated.");
          },
        });
      }}
      onNotificationsClear={() => {
        clearNotifications.mutate(undefined, {
          onSuccess: () => {
            toast.success("Notifications cleared.");
          },
          onError: () => {
            toast.error("Notifications could not be cleared.");
          },
        });
      }}
    />
  );
};

export default HeaderNotifications;
