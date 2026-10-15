import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import HeaderNotifications from "./HeaderNotifications";

const renderHeaderNotifications = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <HeaderNotifications />
    </QueryClientProvider>,
  );
};

const mocks = vi.hoisted(() => ({
  useCurrentUser: vi.fn(),
  useMarkAllNotificationsRead: vi.fn(),
  useMarkNotificationRead: vi.fn(),
  useNotificationList: vi.fn(),
  useUnreadNotificationCount: vi.fn(),
}));

vi.mock("./NotificationDropdown", () => ({
  default: ({
    activeTab,
    onTabChange,
  }: {
    activeTab: string;
    onTabChange: (tab: "unread") => void;
  }) => (
    <button type="button" onClick={() => onTabChange("unread")}>
      {activeTab}
    </button>
  ),
}));
vi.mock("@/modules/auth/hooks/useCurrentUser", () => ({
  useCurrentUser: mocks.useCurrentUser,
}));
vi.mock("@/modules/notifications/hooks/useMarkAllNotificationsRead", () => ({
  useMarkAllNotificationsRead: mocks.useMarkAllNotificationsRead,
}));
vi.mock("@/modules/notifications/hooks/useMarkNotificationRead", () => ({
  useMarkNotificationRead: mocks.useMarkNotificationRead,
}));
vi.mock("@/modules/notifications/hooks/useNotificationList", () => ({
  useNotificationList: mocks.useNotificationList,
}));
vi.mock("@/modules/notifications/hooks/useUnreadNotificationCount", () => ({
  useUnreadNotificationCount: mocks.useUnreadNotificationCount,
}));

describe("HeaderNotifications unread filtering", () => {
  beforeEach(() => {
    mocks.useCurrentUser.mockReturnValue({
      data: {
        id: 9,
        name: "Test User",
        permissions: [],
        modules: [],
        is_super_admin: false,
      },
    });
    mocks.useNotificationList.mockReturnValue({
      data: { data: [] },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    mocks.useUnreadNotificationCount.mockReturnValue({
      data: { data: { count: 3 } },
      refetch: vi.fn(),
    });
    mocks.useMarkNotificationRead.mockReturnValue({
      isPending: false,
      variables: undefined,
      mutate: vi.fn(),
    });
    mocks.useMarkAllNotificationsRead.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    });
  });

  it("requests status=unread when the Unread tab is selected", () => {
    renderHeaderNotifications();

    fireEvent.click(screen.getByRole("button", { name: "all" }));

    expect(mocks.useNotificationList).toHaveBeenLastCalledWith(
      9,
      {
        status: "unread",
        page: 1,
        per_page: 20,
      },
      true,
    );
  });
});
