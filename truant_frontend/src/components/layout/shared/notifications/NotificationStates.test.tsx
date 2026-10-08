import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import NotificationEmptyState from "./NotificationEmptyState";
import NotificationFeedbackState from "./NotificationFeedbackState";

describe("notification UI states", () => {
  it("renders a loading state", () => {
    render(<NotificationFeedbackState isLoading isError={false} />);

    expect(
      screen.getByRole("status", { name: "Loading notifications" }),
    ).toBeInTheDocument();
  });

  it("renders an error with a working retry action", () => {
    const onRetry = vi.fn();

    render(
      <NotificationFeedbackState isLoading={false} isError onRetry={onRetry} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("does not claim unread is empty when the server count is nonzero", () => {
    render(
      <NotificationEmptyState
        activeTab="unread"
        unreadCount={5}
        emptyMessage="No notifications."
      />,
    );

    expect(
      screen.getByText("Unread notifications are being refreshed"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No unread notifications"),
    ).not.toBeInTheDocument();
  });

  it("renders the genuine unread empty state when count is zero", () => {
    render(
      <NotificationEmptyState
        activeTab="unread"
        unreadCount={0}
        emptyMessage="No notifications."
      />,
    );

    expect(screen.getByText("No unread notifications")).toBeInTheDocument();
  });
});
