import { useRef } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { notificationQueryKeys } from "../queryKeys";
import { notificationApi } from "../services/notificationApi";
import {
  archiveNotificationInCache,
  restoreNotificationCache,
  snapshotNotificationCache,
} from "../utils/notificationCache";

export type ArchiveNotificationInput = {
  notificationId: string;
};

export const useArchiveNotification = (userId: number | undefined) => {
  const queryClient = useQueryClient();
  const pendingIds = useRef(new Set<string>());

  const mutation = useMutation({
    mutationFn: ({ notificationId }: ArchiveNotificationInput) =>
      notificationApi.archive(notificationId),

    onMutate: async ({ notificationId }) => {
      if (userId === undefined) {
        return { snapshot: null };
      }

      await queryClient.cancelQueries({
        queryKey: notificationQueryKeys.user(userId),
      });

      const snapshot = snapshotNotificationCache(queryClient, userId);

      archiveNotificationInCache(queryClient, userId, notificationId);

      return { snapshot };
    },

    onError: (_error, _input, context) => {
      if (userId !== undefined && context?.snapshot) {
        restoreNotificationCache(queryClient, userId, context.snapshot);
      }
    },

    onSettled: async (_data, _error, input) => {
      pendingIds.current.delete(input.notificationId);

      if (userId === undefined) return;

      await queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.user(userId),
      });
    },
  });

  const mutate: typeof mutation.mutate = (input, options) => {
    if (pendingIds.current.has(input.notificationId)) return;

    pendingIds.current.add(input.notificationId);
    mutation.mutate(input, options);
  };

  return {
    ...mutation,
    mutate,
  };
};
