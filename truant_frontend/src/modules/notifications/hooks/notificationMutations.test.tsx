import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { notificationQueryKeys } from "../queryKeys";
import { notificationListResponse, notificationRecord } from "../testFixtures";
import type {
  NotificationListResponse,
  UnreadNotificationCountResponse,
} from "../types";
import { useArchiveNotification } from "./useArchiveNotification";
import { useClearNotifications } from "./useClearNotifications";
import { useMarkAllNotificationsRead } from "./useMarkAllNotificationsRead";
import { useMarkNotificationRead } from "./useMarkNotificationRead";

const { archive, clear, markAsRead, markAllAsRead } = vi.hoisted(() => ({
  archive: vi.fn(),
  clear: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
}));

vi.mock("../services/notificationApi", () => ({
  notificationApi: {
    archive,
    clear,
    markAsRead,
    markAllAsRead,
  },
}));

const userId = 41;
const allKey = notificationQueryKeys.list(userId, {
  status: "all",
  page: 1,
  per_page: 20,
});
const unreadKey = notificationQueryKeys.list(userId, {
  status: "unread",
  page: 1,
  per_page: 20,
});
const countKey = notificationQueryKeys.unreadCount(userId);

const createHarness = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
};

const seedNotificationCache = (queryClient: QueryClient) => {
  const unread = notificationRecord();
  const read = notificationRecord({
    id: "notification-2",
    is_read: true,
    read_at: "2026-06-14T02:30:00.000Z",
  });

  queryClient.setQueryData(allKey, notificationListResponse([unread, read]));
  queryClient.setQueryData(unreadKey, notificationListResponse([unread]));
  queryClient.setQueryData(countKey, { data: { count: 1 } });
};

const list = (queryClient: QueryClient, key: typeof allKey) =>
  queryClient.getQueryData<NotificationListResponse>(key);

const count = (queryClient: QueryClient) =>
  queryClient.getQueryData<UnreadNotificationCountResponse>(countKey)?.data
    .count;

describe("notification read mutations", () => {
  beforeEach(() => {
    archive.mockReset();
    clear.mockReset();
    markAsRead.mockReset();
    markAllAsRead.mockReset();
  });

  it("optimistically marks one notification read and keeps the result", async () => {
    const { queryClient, wrapper } = createHarness();

    seedNotificationCache(queryClient);
    markAsRead.mockResolvedValue({
      data: notificationRecord({ is_read: true }),
    });

    const { result } = renderHook(() => useMarkNotificationRead(userId), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        notificationId: "notification-1",
        isRead: false,
      });
    });

    await waitFor(() => {
      expect(count(queryClient)).toBe(0);
      expect(list(queryClient, unreadKey)?.data).toEqual([]);
      expect(list(queryClient, allKey)?.data[0]?.is_read).toBe(true);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("restores every affected cache when one read fails", async () => {
    const { queryClient, wrapper } = createHarness();

    seedNotificationCache(queryClient);
    const previousAll = queryClient.getQueryData(allKey);
    const previousUnread = queryClient.getQueryData(unreadKey);
    const previousCount = queryClient.getQueryData(countKey);

    markAsRead.mockRejectedValue(new Error("Request failed"));

    const { result } = renderHook(() => useMarkNotificationRead(userId), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        notificationId: "notification-1",
        isRead: false,
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData(allKey)).toEqual(previousAll);
    expect(queryClient.getQueryData(unreadKey)).toEqual(previousUnread);
    expect(queryClient.getQueryData(countKey)).toEqual(previousCount);
  });

  it("does not submit or decrement an already-read notification", async () => {
    const { queryClient, wrapper } = createHarness();

    seedNotificationCache(queryClient);

    const { result } = renderHook(() => useMarkNotificationRead(userId), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        notificationId: "notification-2",
        isRead: true,
      });
    });

    expect(markAsRead).not.toHaveBeenCalled();
    expect(count(queryClient)).toBe(1);
  });

  it("prevents duplicate individual read submissions", async () => {
    const { queryClient, wrapper } = createHarness();
    let resolveRequest: (() => void) | undefined;

    seedNotificationCache(queryClient);
    markAsRead.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = () =>
            resolve({ data: notificationRecord({ is_read: true }) });
        }),
    );

    const { result } = renderHook(() => useMarkNotificationRead(userId), {
      wrapper,
    });
    const input = {
      notificationId: "notification-1",
      isRead: false,
    };

    act(() => {
      result.current.mutate(input);
      result.current.mutate(input);
    });

    await waitFor(() => expect(markAsRead).toHaveBeenCalledOnce());
    expect(count(queryClient)).toBe(0);

    act(() => resolveRequest?.());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("optimistically marks all notifications read", async () => {
    const { queryClient, wrapper } = createHarness();

    seedNotificationCache(queryClient);
    markAllAsRead.mockResolvedValue({ data: { updated_count: 1 } });

    const { result } = renderHook(() => useMarkAllNotificationsRead(userId), {
      wrapper,
    });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(count(queryClient)).toBe(0);
      expect(list(queryClient, unreadKey)?.data).toEqual([]);
      expect(
        list(queryClient, allKey)?.data.every(
          (notification) => notification.is_read,
        ),
      ).toBe(true);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("restores every affected cache when mark-all fails", async () => {
    const { queryClient, wrapper } = createHarness();

    seedNotificationCache(queryClient);
    const previousAll = queryClient.getQueryData(allKey);
    const previousUnread = queryClient.getQueryData(unreadKey);
    const previousCount = queryClient.getQueryData(countKey);

    markAllAsRead.mockRejectedValue(new Error("Request failed"));

    const { result } = renderHook(() => useMarkAllNotificationsRead(userId), {
      wrapper,
    });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData(allKey)).toEqual(previousAll);
    expect(queryClient.getQueryData(unreadKey)).toEqual(previousUnread);
    expect(queryClient.getQueryData(countKey)).toEqual(previousCount);
  });

  it("prevents duplicate mark-all submissions", async () => {
    const { queryClient, wrapper } = createHarness();
    let resolveRequest: (() => void) | undefined;

    seedNotificationCache(queryClient);
    markAllAsRead.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = () => resolve({ data: { updated_count: 1 } });
        }),
    );

    const { result } = renderHook(() => useMarkAllNotificationsRead(userId), {
      wrapper,
    });

    act(() => {
      result.current.mutate();
      result.current.mutate();
    });

    await waitFor(() => expect(markAllAsRead).toHaveBeenCalledOnce());

    act(() => resolveRequest?.());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("optimistically archives one notification", async () => {
    const { queryClient, wrapper } = createHarness();

    seedNotificationCache(queryClient);
    archive.mockResolvedValue({ data: notificationRecord() });

    const { result } = renderHook(() => useArchiveNotification(userId), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        notificationId: "notification-1",
      });
    });

    await waitFor(() => {
      expect(count(queryClient)).toBe(0);
      expect(list(queryClient, unreadKey)?.data).toEqual([]);
      expect(
        list(queryClient, allKey)?.data.some(
          (notification) => notification.id === "notification-1",
        ),
      ).toBe(false);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("restores every affected cache when archive fails", async () => {
    const { queryClient, wrapper } = createHarness();

    seedNotificationCache(queryClient);
    const previousAll = queryClient.getQueryData(allKey);
    const previousUnread = queryClient.getQueryData(unreadKey);
    const previousCount = queryClient.getQueryData(countKey);

    archive.mockRejectedValue(new Error("Request failed"));

    const { result } = renderHook(() => useArchiveNotification(userId), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        notificationId: "notification-1",
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData(allKey)).toEqual(previousAll);
    expect(queryClient.getQueryData(unreadKey)).toEqual(previousUnread);
    expect(queryClient.getQueryData(countKey)).toEqual(previousCount);
  });

  it("optimistically clears notifications", async () => {
    const { queryClient, wrapper } = createHarness();

    seedNotificationCache(queryClient);
    clear.mockResolvedValue({ data: { archived_count: 2 } });

    const { result } = renderHook(() => useClearNotifications(userId), {
      wrapper,
    });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(count(queryClient)).toBe(0);
      expect(list(queryClient, unreadKey)?.data).toEqual([]);
      expect(list(queryClient, allKey)?.data).toEqual([]);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
