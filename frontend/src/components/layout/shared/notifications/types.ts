import type { ThemeColor } from "@core/types";

export type HeaderNotification = {
  id: string;
  title: string;
  summary: string;
  details?: string;
  createdAt: string;
  href: string;
  linkLabel?: string;
  icon: string;
  color?: ThemeColor;
  read?: boolean;
  recipientNames?: string[];
  requiredPermissions?: string[];
  requiredModules?: string[];
};

export type NotificationViewer = {
  name?: string;
  permissions?: string[];
  modules?: string[];
  isSuperAdmin?: boolean;
};

export type NotificationTab = "all" | "unread";

export type NotificationDropdownProps = {
  notifications: HeaderNotification[];
  viewer?: NotificationViewer;
  activeTab: NotificationTab;
  unreadCount: number;
  isLoading?: boolean;
  isError?: boolean;
  isMarkingAllRead?: boolean;
  isClearingNotifications?: boolean;
  readingNotificationId?: string;
  archivingNotificationId?: string;
  onTabChange: (tab: NotificationTab) => void;
  onNotificationRead?: (notificationId: string, isRead: boolean) => void;
  onNotificationArchive?: (notificationId: string) => void;
  onAllNotificationsRead?: (notificationIds: string[]) => void;
  onNotificationsClear?: () => void;
  onRetry?: () => void;
  emptyMessage?: string;
};
