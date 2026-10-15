"use client";

import type { KeyboardEvent, MouseEvent } from "react";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CustomAvatar from "@core/components/mui/Avatar";
import CustomBadge from "@core/components/mui/Badge";

import type { HeaderNotification } from "./types";

type NotificationItemProps = {
  notification: HeaderNotification;
  isRead: boolean;
  menuOpen: boolean;
  menuDisabled?: boolean;
  onOpen: (notification: HeaderNotification) => void;
  onMenuOpen: (
    event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>,
    notificationId: string,
  ) => void;
};

const NotificationItem = ({
  notification,
  isRead,
  menuOpen,
  menuDisabled = false,
  onOpen,
  onMenuOpen,
}: NotificationItemProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    onOpen(notification);
  };

  return (
    <Card
      variant="outlined"
      sx={{
        backgroundColor: isRead ? "background.paper" : "action.hover",
        cursor: "pointer",
        "&:hover": {
          backgroundColor: "action.selected",
        },
      }}
      onClick={() => onOpen(notification)}
      onKeyDown={handleKeyDown}
      role="button"
      aria-label={`Open ${notification.title}`}
      tabIndex={0}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CustomBadge
            variant="dot"
            color="primary"
            invisible={isRead}
            overlap="circular"
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            sx={{ flexShrink: 0 }}
          >
            <CustomAvatar
              color={notification.color ?? "primary"}
              skin="light"
              size={34}
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
              <i className={notification.icon} />
            </CustomAvatar>
          </CustomBadge>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                variant="body2"
                color="text.primary"
                fontWeight={isRead ? 500 : 600}
                noWrap
                sx={{ flex: 1 }}
              >
                {notification.title}
              </Typography>
              <IconButton
                size="small"
                aria-label={`Actions for ${notification.title}`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                disabled={menuDisabled}
                onMouseDown={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    onMenuOpen(event, notification.id);
                  }
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  onMenuOpen(event, notification.id);
                }}
                sx={{
                  inlineSize: 28,
                  blockSize: 28,
                  flexShrink: 0,
                }}
              >
                <i className="bx bx-dots-horizontal-rounded" />
              </IconButton>
            </Stack>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ display: "block", mt: 0.25 }}
            >
              {notification.summary}
            </Typography>
            <Typography
              variant="caption"
              color={isRead ? "text.disabled" : "primary"}
              sx={{ display: "block", mt: 0.25 }}
            >
              {notification.createdAt}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default NotificationItem;
