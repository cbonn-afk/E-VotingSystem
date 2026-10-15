import type { HeaderNotification } from "@/components/layout/shared/NotificationDropdown";

import type { NotificationRecord } from "../types";
import { getSafeNotificationDestination } from "./notificationDestination";

const formatCreatedAt = (createdAt: string | null): string => {
  if (!createdAt) {
    return "Recently";
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export const mapNotificationToHeader = (
  notification: NotificationRecord,
): HeaderNotification => {
  const href = getSafeNotificationDestination(notification.action_url);

  return {
    id: notification.id,
    title: notification.title,
    summary: notification.message,
    details: notification.message,
    createdAt: formatCreatedAt(notification.created_at),
    href,
    linkLabel: href === "/home" ? "Go to ERP Center" : "Open page",
    icon: "bx bx-shield-quarter",
    color: "primary",
    read: notification.is_read,
  };
};
