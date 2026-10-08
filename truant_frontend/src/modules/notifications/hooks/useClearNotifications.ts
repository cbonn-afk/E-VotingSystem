import { useRef } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { notificationQueryKeys } from "../queryKeys";
import { notificationApi } from "../services/notificationApi";
import {
  clearNotificationsInCache,
  restoreNotificationCache,
  snapshotNotificationCache,
} from "../utils/notificationCache";

export const useClearNotifications = (userId: number | undefined) => {
  const queryClient = useQueryClient();
  const isSubmitting = useRef(false);

  const mutation = useMutation({
    mutationFn: notificationApi.clear,

    onMutate: async () => {
      if (userId === undefined) {
        return { snapshot: null };
      }

      await queryClient.cancelQueries({
        queryKey: notificationQueryKeys.user(userId),
      });

      const snapshot = snapshotNotificationCache(queryClient, userId);

      clearNotificationsInCache(queryClient, userId);

      return { snapshot };
    },

    onError: (_error, _variables, context) => {
      if (userId !== undefined && context?.snapshot) {
        restoreNotificationCache(queryClient, userId, context.snapshot);
      }
    },

    onSettled: async () => {
      isSubmitting.current = false;

      if (userId === undefined) return;

      await queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.user(userId),
      });
    },
  });

  const mutate: typeof mutation.mutate = (variables, options) => {
    if (isSubmitting.current) return;

    isSubmitting.current = true;
    mutation.mutate(variables, options);
  };

  return {
    ...mutation,
    mutate,
  };
};
