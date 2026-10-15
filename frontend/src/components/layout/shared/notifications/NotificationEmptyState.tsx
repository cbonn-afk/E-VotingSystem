import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CustomAvatar from "@core/components/mui/Avatar";

import type { NotificationTab } from "./types";

type NotificationEmptyStateProps = {
  activeTab: NotificationTab;
  unreadCount: number;
  emptyMessage: string;
};

const NotificationEmptyState = ({
  activeTab,
  unreadCount,
  emptyMessage,
}: NotificationEmptyStateProps) => {
  const hasUnloadedUnreadNotifications =
    activeTab === "unread" && unreadCount > 0;

  return (
    <Stack
      spacing={2}
      className="items-center text-center"
      sx={{ px: 5, py: 8 }}
    >
      <CustomAvatar
        color="secondary"
        skin="light"
        size={42}
        variant="rounded"
        sx={{
          "& > i": {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          },
        }}
      >
        <i className="bx bx-bell-off" />
      </CustomAvatar>
      <Box>
        <Typography variant="subtitle1">
          {hasUnloadedUnreadNotifications
            ? "Unread notifications are being refreshed"
            : activeTab === "unread"
              ? "No unread notifications"
              : "You are all caught up"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {hasUnloadedUnreadNotifications
            ? "Refresh to load the remaining unread notifications."
            : activeTab === "unread"
              ? "New notifications will appear here."
              : emptyMessage}
        </Typography>
      </Box>
    </Stack>
  );
};

export default NotificationEmptyState;
