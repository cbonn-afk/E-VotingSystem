import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { notificationQueryKeys } from "../queryKeys";
import type { NotificationBroadcast } from "../types";
import { useNotificationSubscription } from "./useNotificationSubscription";

const echoMocks = vi.hoisted(() => ({
  disconnect: vi.fn(),
  getEchoClient: vi.fn(),
  leave: vi.fn(),
  stopListening: vi.fn(),
}));

vi.mock("@/libs/realtime/echoClient", () => ({
  disconnectEchoClient: echoMocks.disconnect,
  getEchoClient: echoMocks.getEchoClient,
}));

describe("notification realtime subscription", () => {
  beforeEach(() => {
    Object.values(echoMocks).forEach((mock) => mock.mockReset());
  });

  it("invalidates only the current user and cleans up on account change", async () => {
    const handlers = new Map<
      string,
      (notification: NotificationBroadcast) => void
    >();
    const channel = (name: string) => ({
      notification: (
        handler: (notification: NotificationBroadcast) => void,
      ) => {
        handlers.set(name, handler);
      },
      stopListeningForNotification: echoMocks.stopListening,
    });
    const echo = {
      private: vi.fn(channel),
      leave: echoMocks.leave,
    };

    echoMocks.getEchoClient.mockResolvedValue(echo);

    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    queryClient.setQueryData(
      notificationQueryKeys.list(10, { status: "all" }),
      { data: ["old-user-data"] },
    );

    const { rerender, unmount } = renderHook(
      ({ userId }) => useNotificationSubscription(userId),
      {
        initialProps: { userId: 10 },
        wrapper,
      },
    );

    await waitFor(() => expect(echo.private).toHaveBeenCalledWith("users.10"));

    act(() => {
      handlers.get("users.10")?.({
        id: "event-1",
        type: "test.notification",
        title: "Updated",
        message: "Updated",
        actor: null,
        roles: [],
        action_url: "/home",
      });
    });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: notificationQueryKeys.user(10),
    });

    rerender({ userId: 20 });

    await waitFor(() => {
      expect(echoMocks.stopListening).toHaveBeenCalledOnce();
      expect(echoMocks.leave).toHaveBeenCalledWith("users.10");
      expect(echoMocks.disconnect).toHaveBeenCalled();
      expect(
        queryClient.getQueriesData({
          queryKey: notificationQueryKeys.user(10),
        }),
      ).toEqual([]);
      expect(echo.private).toHaveBeenCalledWith("users.20");
    });

    unmount();

    expect(echoMocks.leave).toHaveBeenCalledWith("users.20");
  });
});
