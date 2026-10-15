import { useRef } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { notificationQueryKeys } from "../queryKeys";
import { notificationApi } from "../services/notificationApi";
import {
  markNotificationReadInCache,
  restoreNotificationCache,
  snapshotNotificationCache,
} from "../utils/notificationCache";

export type MarkNotificationReadInput = {
  notificationId: string;
  isRead: boolean;
};

export const useMarkNotificationRead = (userId: number | undefined) => {
  const queryClient = useQueryClient();
  const pendingIds = useRef(new Set<string>());

  const mutation = useMutation({
    mutationFn: ({ notificationId, isRead }: MarkNotificationReadInput) =>
      isRead
        ? Promise.resolve(null)
        : notificationApi.markAsRead(notificationId),

    onMutate: async ({ notificationId, isRead }) => {
      if (userId === undefined || isRead) {
        return { snapshot: null };
      }

      await queryClient.cancelQueries({
        queryKey: notificationQueryKeys.user(userId),
      });

      const snapshot = snapshotNotificationCache(queryClient, userId);

      markNotificationReadInCache(queryClient, userId, notificationId);

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
    if (input.isRead || pendingIds.current.has(input.notificationId)) return;

    pendingIds.current.add(input.notificationId);
    mutation.mutate(input, options);
  };

  return {
    ...mutation,
    mutate,
  };
};
