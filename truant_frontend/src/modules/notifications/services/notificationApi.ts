import { apiClient } from "@/libs/api/apiClient";

import type {
  ClearNotificationsResponse,
  MarkAllNotificationsReadResponse,
  NotificationListParams,
  NotificationListResponse,
  NotificationResourceResponse,
  UnreadNotificationCountResponse,
} from "../types";

const buildListQuery = (params: NotificationListParams): string => {
  const query = new URLSearchParams();

  if (params.status) {
    query.set("status", params.status);
  }

  if (params.page !== undefined) {
    query.set("page", String(params.page));
  }

  if (params.per_page !== undefined) {
    query.set("per_page", String(params.per_page));
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
};

export const notificationApi = {
  list(params: NotificationListParams = {}): Promise<NotificationListResponse> {
    return apiClient<NotificationListResponse>(
      `/api/notifications${buildListQuery(params)}`,
    );
  },

  unreadCount(): Promise<UnreadNotificationCountResponse> {
    return apiClient<UnreadNotificationCountResponse>(
      "/api/notifications/unread-count",
    );
  },

  markAsRead(notificationId: string): Promise<NotificationResourceResponse> {
    return apiClient<NotificationResourceResponse>(
      `/api/notifications/${encodeURIComponent(notificationId)}/read`,
      {
        method: "PATCH",
      },
    );
  },

  markAllAsRead(): Promise<MarkAllNotificationsReadResponse> {
    return apiClient<MarkAllNotificationsReadResponse>(
      "/api/notifications/read-all",
      {
        method: "PATCH",
      },
    );
  },

  archive(notificationId: string): Promise<NotificationResourceResponse> {
    return apiClient<NotificationResourceResponse>(
      `/api/notifications/${encodeURIComponent(notificationId)}/archive`,
      {
        method: "PATCH",
      },
    );
  },

  clear(): Promise<ClearNotificationsResponse> {
    return apiClient<ClearNotificationsResponse>("/api/notifications/clear", {
      method: "PATCH",
    });
  },
};
