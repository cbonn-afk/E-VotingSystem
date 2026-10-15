"use client";

import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

type NotificationActionsMenuProps = {
  anchorEl: HTMLElement | null;
  notificationId: string | null;
  isRead: boolean;
  isPending?: boolean;
  onClose: () => void;
  onMarkAsRead: () => void;
  onArchive: () => void;
};

const NotificationActionsMenu = ({
  anchorEl,
  notificationId,
  isRead,
  isPending = false,
  onClose,
  onMarkAsRead,
  onArchive,
}: NotificationActionsMenuProps) => (
  <Menu
    anchorEl={anchorEl}
    open={Boolean(anchorEl)}
    onClose={onClose}
    keepMounted
    transitionDuration={0}
    anchorOrigin={{ vertical: "center", horizontal: "left" }}
    transformOrigin={{ vertical: "center", horizontal: "right" }}
    MenuListProps={{ dense: true }}
    slotProps={{
      paper: {
        sx: {
          minWidth: 190,
          mr: 1,
        },
      },
    }}
  >
    <MenuItem
      disabled={!notificationId || isRead || isPending}
      onClick={onMarkAsRead}
    >
      <ListItemIcon>
        <i className="bx bx-check" />
      </ListItemIcon>
      Mark as read
    </MenuItem>
    <MenuItem disabled={!notificationId || isPending} onClick={onArchive}>
      <ListItemIcon>
        <i className="bx bx-archive" />
      </ListItemIcon>
      Archive
    </MenuItem>
  </Menu>
);

export default NotificationActionsMenu;
