"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { authQueryKeys } from "@/modules/auth/queryKeys";
import { useNotificationSubscription } from "@/modules/notifications/hooks/useNotificationSubscription";
import type { NotificationBroadcast } from "@/modules/notifications/types";

const ROLE_UPDATE_TYPE = "identity_access.user.roles.updated";
const TAILOR_ASSIGNED_TYPE = "ordering.tailor.assigned";
const PRODUCTION_STAGE_ADVANCED_TYPE = "ordering.production.stage.advanced";

const showActionToast = (
  notification: NotificationBroadcast,
  router: ReturnType<typeof useRouter>,
) => {
  const actionUrl = notification.action_url;

  toast.info(
    <div>
      <strong style={{ display: "block", marginBottom: 2 }}>
        {notification.title}
      </strong>
      <span style={{ fontSize: "0.85em", opacity: 0.85 }}>
        {notification.message}
      </span>
    </div>,
    {
      autoClose: 8000,
      onClick: actionUrl ? () => router.push(actionUrl) : undefined,
      style: { cursor: actionUrl ? "pointer" : "default" },
    },
  );
};

const AuthorizationRealtimeSync = ({ userId }: { userId: number }) => {
  const queryClient = useQueryClient();
  const router      = useRouter();

  const handleNotification = useCallback(
    (notification: NotificationBroadcast) => {
      // ── Role update → refresh auth state ─────────────────────────────────
      if (notification.type === ROLE_UPDATE_TYPE) {
        void queryClient.invalidateQueries({
          queryKey: authQueryKeys.currentUser(),
        });
        return;
      }

      // ── production unit assignment → real-time toast ──────────────────────────
      if (notification.type === TAILOR_ASSIGNED_TYPE) {
        showActionToast(notification, router);
        return;
      }

      if (notification.type === PRODUCTION_STAGE_ADVANCED_TYPE) {
        showActionToast(notification, router);
      }
    },
    [queryClient, router],
  );

  useNotificationSubscription(userId, {
    onNotification: handleNotification,
  });

  return null;
};

export default AuthorizationRealtimeSync;
