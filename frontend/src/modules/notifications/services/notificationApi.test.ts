import { beforeEach, describe, expect, it, vi } from "vitest";

import { notificationApi } from "./notificationApi";

const { apiClient } = vi.hoisted(() => ({
  apiClient: vi.fn(),
}));

vi.mock("@/libs/api/apiClient", () => ({
  apiClient,
}));

describe("notification API", () => {
  beforeEach(() => {
    apiClient.mockReset();
  });

  it("requests backend-filtered unread notifications", async () => {
    apiClient.mockResolvedValue({ data: [] });

    await notificationApi.list({
      status: "unread",
      page: 1,
      per_page: 20,
    });

    expect(apiClient).toHaveBeenCalledWith(
      "/api/notifications?status=unread&page=1&per_page=20",
    );
  });

  it("archives one notification through the backend endpoint", async () => {
    apiClient.mockResolvedValue({ data: {} });

    await notificationApi.archive("notification-1");

    expect(apiClient).toHaveBeenCalledWith(
      "/api/notifications/notification-1/archive",
      {
        method: "PATCH",
      },
    );
  });

  it("clears notifications through the backend endpoint", async () => {
    apiClient.mockResolvedValue({ data: { archived_count: 2 } });

    await notificationApi.clear();

    expect(apiClient).toHaveBeenCalledWith("/api/notifications/clear", {
      method: "PATCH",
    });
  });
});
