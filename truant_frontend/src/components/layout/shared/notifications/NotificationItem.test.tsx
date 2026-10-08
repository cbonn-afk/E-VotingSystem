import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { HeaderNotification } from "./types";
import NotificationItem from "./NotificationItem";

const notification: HeaderNotification = {
  id: "notification-1",
  title: "Order ready",
  summary: "SO-1001 is ready.",
  createdAt: "Today",
  href: "/ordering/forms/1",
  icon: "bx bx-bell",
  read: false,
};

describe("NotificationItem interactions", () => {
  it.each(["Enter", " "])("opens the card with the %s key", (key) => {
    const onOpen = vi.fn();

    render(
      <NotificationItem
        notification={notification}
        isRead={false}
        menuOpen={false}
        onOpen={onOpen}
        onMenuOpen={vi.fn()}
      />,
    );

    fireEvent.keyDown(
      screen.getByRole("button", { name: "Open Order ready" }),
      { key },
    );

    expect(onOpen).toHaveBeenCalledWith(notification);
  });

  it.each(["Enter", " "])(
    "opens only the actions menu with the %s key",
    (key) => {
      const onOpen = vi.fn();
      const onMenuOpen = vi.fn();

      render(
        <NotificationItem
          notification={notification}
          isRead={false}
          menuOpen={false}
          onOpen={onOpen}
          onMenuOpen={onMenuOpen}
        />,
      );

      fireEvent.keyDown(
        screen.getByRole("button", { name: "Actions for Order ready" }),
        { key },
      );

      expect(onMenuOpen).toHaveBeenCalledOnce();
      expect(onOpen).not.toHaveBeenCalled();
    },
  );

  it("keeps mouse actions on the menu button out of the card", () => {
    const onOpen = vi.fn();
    const onMenuOpen = vi.fn();

    render(
      <NotificationItem
        notification={notification}
        isRead={false}
        menuOpen={false}
        onOpen={onOpen}
        onMenuOpen={onMenuOpen}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Actions for Order ready" }),
    );

    expect(onMenuOpen).toHaveBeenCalledOnce();
    expect(onOpen).not.toHaveBeenCalled();
  });
});
