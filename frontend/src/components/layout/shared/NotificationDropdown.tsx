"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";

import { useRouter } from "next/navigation";

import Box from "@mui/material/Box";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Fade from "@mui/material/Fade";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import Stack from "@mui/material/Stack";

import { useSettings } from "@core/hooks/useSettings";

import NotificationActionsMenu from "./notifications/NotificationActionsMenu";
import NotificationBellButton from "./notifications/NotificationBellButton";
import NotificationEmptyState from "./notifications/NotificationEmptyState";
import NotificationFeedbackState from "./notifications/NotificationFeedbackState";
import NotificationItem from "./notifications/NotificationItem";
import NotificationPanelHeader from "./notifications/NotificationPanelHeader";
import type {
  HeaderNotification,
  NotificationDropdownProps,
  NotificationViewer,
} from "./notifications/types";
import { useNotifications } from "./notifications/useNotifications";

export type { HeaderNotification, NotificationViewer };

const NotificationDropdown = ({
  notifications,
  viewer,
  activeTab,
  unreadCount,
  isLoading = false,
  isError = false,
  isMarkingAllRead = false,
  isClearingNotifications = false,
  readingNotificationId,
  archivingNotificationId,
  onTabChange,
  onNotificationRead,
  onNotificationArchive,
  onAllNotificationsRead,
  onNotificationsClear,
  onRetry,
  emptyMessage = "You have no notifications right now.",
}: NotificationDropdownProps) => {
  const router = useRouter();
  const { settings } = useSettings();
  const anchorRef = useRef<HTMLButtonElement>(null);

  const [open, setOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuNotificationId, setMenuNotificationId] = useState<string | null>(
    null,
  );

  const { visibleNotifications, markAsRead, markAllAsRead, archive, clear } =
    useNotifications({
      notifications,
      viewer,
      onNotificationRead,
      onNotificationArchive,
      onAllNotificationsRead,
      onNotificationsClear,
    });
  const closeNotificationMenu = () => {
    setMenuAnchor(null);
    setMenuNotificationId(null);
  };

  const openNotificationMenu = (
    event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>,
    notificationId: string,
  ) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuNotificationId(notificationId);
  };

  const markSelectedAsRead = () => {
    const notification = visibleNotifications.find(
      (item) => item.id === menuNotificationId,
    );

    if (notification) markAsRead(notification);

    closeNotificationMenu();
  };

  const archiveSelected = () => {
    const notification = visibleNotifications.find(
      (item) => item.id === menuNotificationId,
    );

    if (notification) archive(notification);

    closeNotificationMenu();
  };

  const openNotification = (notification: HeaderNotification) => {
    markAsRead(notification);
    setOpen(false);
    router.push(notification.href);
  };

  return (
    <>
      <NotificationBellButton
        anchorRef={anchorRef}
        open={open}
        unreadCount={unreadCount}
        onClick={() => setOpen((current) => !current)}
      />

      <Popper
        open={open}
        transition
        disablePortal
        placement="bottom-end"
        anchorEl={anchorRef.current}
        className="!mbs-4 z-[2]"
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === "bottom-end" ? "right top" : "left top",
            }}
          >
            <Paper
              className={
                settings.skin === "bordered"
                  ? "border shadow-none"
                  : "shadow-lg"
              }
              sx={{
                inlineSize: {
                  xs: "calc(100vw - 32px)",
                  sm: 400,
                },
                maxInlineSize: 400,
                overflow: "hidden",
              }}
            >
              <ClickAwayListener onClickAway={() => setOpen(false)}>
                <Box>
                  <NotificationPanelHeader
                    viewer={viewer}
                    activeTab={activeTab}
                    unreadCount={unreadCount}
                    visibleCount={visibleNotifications.length}
                    isMarkingAllRead={isMarkingAllRead}
                    isClearingNotifications={isClearingNotifications}
                    onTabChange={onTabChange}
                    onMarkAllAsRead={markAllAsRead}
                    onClearNotifications={clear}
                  />

                  <Box
                    sx={{
                      maxBlockSize: 480,
                      overflowY: "auto",
                      p: 2,
                    }}
                  >
                    <NotificationFeedbackState
                      isLoading={isLoading}
                      isError={isError}
                      onRetry={onRetry}
                    />

                    {!isLoading &&
                    !isError &&
                    visibleNotifications.length === 0 ? (
                      <NotificationEmptyState
                        activeTab={activeTab}
                        unreadCount={unreadCount}
                        emptyMessage={emptyMessage}
                      />
                    ) : !isLoading && !isError ? (
                      <Stack spacing={1}>
                        {visibleNotifications.map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            isRead={Boolean(notification.read)}
                            menuDisabled={
                              readingNotificationId === notification.id ||
                              archivingNotificationId === notification.id
                            }
                            menuOpen={
                              menuNotificationId === notification.id &&
                              Boolean(menuAnchor)
                            }
                            onOpen={openNotification}
                            onMenuOpen={openNotificationMenu}
                          />
                        ))}
                      </Stack>
                    ) : null}
                  </Box>

                  <NotificationActionsMenu
                    anchorEl={menuAnchor}
                    notificationId={menuNotificationId}
                    isRead={
                      menuNotificationId
                        ? Boolean(
                            visibleNotifications.find(
                              (item) => item.id === menuNotificationId,
                            )?.read,
                          )
                        : false
                    }
                    isPending={
                      readingNotificationId === menuNotificationId ||
                      archivingNotificationId === menuNotificationId
                    }
                    onClose={closeNotificationMenu}
                    onMarkAsRead={markSelectedAsRead}
                    onArchive={archiveSelected}
                  />
                </Box>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  );
};

export default NotificationDropdown;
