import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";

import type { NotificationTab, NotificationViewer } from "./types";

type NotificationPanelHeaderProps = {
  viewer?: NotificationViewer;
  activeTab: NotificationTab;
  unreadCount: number;
  visibleCount: number;
  isMarkingAllRead?: boolean;
  isClearingNotifications?: boolean;
  onTabChange: (tab: NotificationTab) => void;
  onMarkAllAsRead: () => void;
  onClearNotifications: () => void;
};

const NotificationPanelHeader = ({
  viewer,
  activeTab,
  unreadCount,
  visibleCount,
  isMarkingAllRead = false,
  isClearingNotifications = false,
  onTabChange,
  onMarkAllAsRead,
  onClearNotifications,
}: NotificationPanelHeaderProps) => (
  <>
    <Stack
      direction="row"
      className="items-center justify-between"
      sx={{ px: 4, py: 3 }}
    >
      <Box>
        <Typography variant="h6">Notifications</Typography>
        <Typography variant="caption" color="text.secondary">
          {viewer?.name
            ? `Updates for ${viewer.name}`
            : "Account and workflow updates"}
        </Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        <Button
          size="small"
          variant="text"
          disabled={unreadCount === 0 || isMarkingAllRead}
          onClick={onMarkAllAsRead}
        >
          {isMarkingAllRead ? "Updating..." : "Mark all read"}
        </Button>
        <Button
          size="small"
          variant="text"
          color="error"
          disabled={visibleCount === 0 || isClearingNotifications}
          onClick={onClearNotifications}
        >
          {isClearingNotifications ? "Clearing..." : "Clear"}
        </Button>
      </Stack>
    </Stack>

    <Divider />

    <Tabs
      value={activeTab}
      onChange={(_, value: NotificationTab) => onTabChange(value)}
      aria-label="Notification filters"
      variant="fullWidth"
      sx={{ px: 2 }}
    >
      <Tab value="all" label="All" />
      <Tab value="unread" label={`Unread (${unreadCount})`} />
    </Tabs>

    <Divider />
  </>
);

export default NotificationPanelHeader;
