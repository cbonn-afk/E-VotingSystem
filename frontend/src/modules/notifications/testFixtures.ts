import type { NotificationListResponse, NotificationRecord } from "./types";

export const notificationRecord = (
  overrides: Partial<NotificationRecord> = {},
): NotificationRecord => ({
  id: "notification-1",
  type: "test.notification",
  title: "Order ready",
  message: "Order SO-1001 is ready.",
  actor: null,
  roles: [],
  action_url: "/ordering/forms",
  is_read: false,
  read_at: null,
  created_at: "2026-06-14T02:00:00.000Z",
  ...overrides,
});

export const notificationListResponse = (
  data: NotificationRecord[],
): NotificationListResponse => ({
  data,
  links: {
    first: null,
    last: null,
    prev: null,
    next: null,
  },
  meta: {
    current_page: 1,
    from: data.length > 0 ? 1 : null,
    last_page: 1,
    links: [],
    path: "/api/notifications",
    per_page: 20,
    to: data.length > 0 ? data.length : null,
    total: data.length,
  },
});
