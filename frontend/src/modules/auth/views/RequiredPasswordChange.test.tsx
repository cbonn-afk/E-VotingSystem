import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/libs/api/apiError";

import RequiredPasswordChange from "./RequiredPasswordChange";

const mocks = vi.hoisted(() => ({
  changePassword: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("@/modules/auth/hooks/useChangePassword", () => ({
  useChangePassword: () => ({
    mutateAsync: mocks.changePassword,
    isPending: false,
  }),
}));

vi.mock("@/modules/auth/hooks/useLogout", () => ({
  useLogout: () => ({
    mutateAsync: mocks.logout,
    isPending: false,
  }),
}));

describe("RequiredPasswordChange", () => {
  beforeEach(() => {
    mocks.changePassword.mockReset();
    mocks.logout.mockReset();
  });

  it("keeps entered values and displays Laravel validation errors", async () => {
    mocks.changePassword.mockRejectedValue(
      new ApiError(422, {
        current_password: ["The current password is incorrect."],
      }),
    );

    render(<RequiredPasswordChange />);

    fireEvent.change(screen.getByLabelText("Current Password"), {
      target: { value: "wrong-password" },
    });
    fireEvent.change(screen.getByLabelText("New Password"), {
      target: { value: "NewSecurePassword123!" },
    });
    fireEvent.change(screen.getByLabelText("Confirm New Password"), {
      target: { value: "NewSecurePassword123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update Password" }));

    await waitFor(() => {
      expect(
        screen.getByText("The current password is incorrect."),
      ).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Current Password")).toHaveValue(
      "wrong-password",
    );
    expect(screen.getByRole("button", { name: "Log out" })).toBeEnabled();
  });
});
