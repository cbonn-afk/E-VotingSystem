export type NotificationStatus = "all" | "read" | "unread";

export interface NotificationListParams {
  status?: NotificationStatus;
  page?: number;
  per_page?: number;
}

export interface NotificationActor {
  id: number;
  name: string;
}

export interface NotificationRecord {
  id: string;
  type: string;
  title: string;
  message: string;
  actor: NotificationActor | null;
  roles: string[];
  action_url: string | null;
  is_read: boolean;
  is_archived?: boolean;
  read_at: string | null;
  archived_at?: string | null;
  created_at: string | null;
}

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface NotificationListResponse {
  data: NotificationRecord[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    links: PaginationLink[];
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
}

export interface NotificationResourceResponse {
  data: NotificationRecord;
}

export interface UnreadNotificationCountResponse {
  data: {
    count: number;
  };
}

export interface MarkAllNotificationsReadResponse {
  data: {
    updated_count: number;
  };
}

export interface ClearNotificationsResponse {
  data: {
    archived_count: number;
  };
}

export interface NotificationBroadcast {
  id: string;
  type: string;
  title: string;
  message: string;
  actor: NotificationActor | null;
  roles: string[];
  action_url: string | null;
}
