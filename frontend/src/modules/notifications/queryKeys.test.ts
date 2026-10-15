import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { notificationQueryKeys } from "./queryKeys";
import { clearNotificationSession } from "./utils/notificationSession";

const { resetEchoClient } = vi.hoisted(() => ({
  resetEchoClient: vi.fn(),
}));

vi.mock("@/libs/realtime/echoClient", () => ({
  resetEchoClient,
}));

describe("notification query ownership", () => {
  beforeEach(() => {
    resetEchoClient.mockReset();
  });

  it("scopes lists and unread counts by authenticated user", () => {
    expect(notificationQueryKeys.list(10, { status: "all" })).not.toEqual(
      notificationQueryKeys.list(20, { status: "all" }),
    );
    expect(notificationQueryKeys.unreadCount(10)).not.toEqual(
      notificationQueryKeys.unreadCount(20),
    );
  });

  it("purges notification data and Echo when the account changes", async () => {
    const queryClient = new QueryClient();

    queryClient.setQueryData(
      notificationQueryKeys.list(10, { status: "all" }),
      { data: ["user-10"] },
    );
    queryClient.setQueryData(notificationQueryKeys.unreadCount(20), {
      data: { count: 3 },
    });

    await clearNotificationSession(queryClient);

    expect(
      queryClient.getQueriesData({
        queryKey: notificationQueryKeys.all,
      }),
    ).toEqual([]);
    expect(resetEchoClient).toHaveBeenCalledOnce();
  });
});
