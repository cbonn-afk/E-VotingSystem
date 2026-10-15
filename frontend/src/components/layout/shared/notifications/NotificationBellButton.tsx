"use client";

import type { RefObject } from "react";

import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import CustomBadge from "@core/components/mui/Badge";

type NotificationBellButtonProps = {
  anchorRef: RefObject<HTMLButtonElement | null>;
  open: boolean;
  unreadCount: number;
  onClick: () => void;
};

const NotificationBellButton = ({
  anchorRef,
  open,
  unreadCount,
  onClick,
}: NotificationBellButtonProps) => (
  <Tooltip title="Notifications">
    <IconButton
      ref={anchorRef}
      aria-label={`${unreadCount} unread notifications`}
      aria-haspopup="true"
      aria-expanded={open}
      className="text-textPrimary"
      onClick={onClick}
      sx={{
        inlineSize: 40,
        blockSize: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CustomBadge
        badgeContent={unreadCount}
        color="error"
        max={99}
        overlap="circular"
        tonal="false"
        invisible={unreadCount === 0}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          "& > i": {
            inlineSize: 24,
            blockSize: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.375rem",
            lineHeight: 1,
          },
          "& .MuiBadge-badge": {
            minWidth: 16,
            height: 16,
            px: 1,
            fontSize: "0.625rem",
          },
        }}
      >
        <i className="bx bx-bell" />
      </CustomBadge>
    </IconButton>
  </Tooltip>
);

export default NotificationBellButton;
