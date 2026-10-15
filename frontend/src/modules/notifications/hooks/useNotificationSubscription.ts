"use client";

import { useEffect, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";

import {
  disconnectEchoClient,
  getEchoClient,
} from "@/libs/realtime/echoClient";

import { notificationQueryKeys } from "../queryKeys";
import type { NotificationBroadcast } from "../types";

type NotificationSubscriptionOptions = {
  onNotification?: (notification: NotificationBroadcast) => void;
  onConnectionError?: (error: unknown) => void;
};

export const useNotificationSubscription = (
  userId: number | undefined,
  options: NotificationSubscriptionOptions = {},
) => {
  const queryClient = useQueryClient();
  const onNotificationRef = useRef(options.onNotification);
  const onConnectionErrorRef = useRef(options.onConnectionError);

  useEffect(() => {
    onNotificationRef.current = options.onNotification;
    onConnectionErrorRef.current = options.onConnectionError;
  }, [options.onConnectionError, options.onNotification]);

  useEffect(() => {
    if (!userId) return;

    const channelName = `users.${userId}`;
    const receivedIds = new Set<string>();
    let disposed = false;
    let unsubscribe = () => {};

    void getEchoClient()
      .then((echo) => {
        if (disposed) return;

        const channel = echo.private(channelName);
        const handleNotification = (notification: NotificationBroadcast) => {
          if (receivedIds.has(notification.id)) {
            return;
          }

          receivedIds.add(notification.id);

          void queryClient.invalidateQueries({
            queryKey: notificationQueryKeys.user(userId),
          });

          onNotificationRef.current?.(notification);
        };

        channel.notification(handleNotification);
        unsubscribe = () => {
          channel.stopListeningForNotification(handleNotification);
          echo.leave(channelName);
        };
      })
      .catch((error: unknown) => {
        if (!disposed) {
          onConnectionErrorRef.current?.(error);
        }
      });

    return () => {
      disposed = true;
      unsubscribe();
      queryClient.removeQueries({
        queryKey: notificationQueryKeys.user(userId),
      });
      void disconnectEchoClient();
    };
  }, [queryClient, userId]);
};
