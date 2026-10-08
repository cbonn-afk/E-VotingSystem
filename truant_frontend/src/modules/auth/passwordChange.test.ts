import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { handleRequiredPasswordChange } from "@/modules/auth/components/PasswordChangeRequiredListener";
import { authQueryKeys } from "@/modules/auth/queryKeys";
import { mapChangePasswordRequest } from "@/modules/auth/schemas/changePasswordSchema";
import { normalizeAuthUser } from "@/modules/auth/services/authApi";
import type { User } from "@/modules/auth/types";

import {
  canRenderGuardedContent,
  getAuthenticatedDestination,
  getFallbackHomePath,
  getPasswordChangeGuardRedirect,
  getRequestedDestination,
} from "./passwordChange";

const user = (overrides: Partial<User> = {}): User => ({
  id: 1,
  name: "Member User",
  email: "user@example.com",
  phone: null,
  address: null,
  avatar_url: null,
  theme_preference: "system",
  email_verified_at: null,
  status: "active",
  deactivated_at: null,
  is_super_admin: false,
  roles: ["Member"],
  permissions: [],
  modules: [],
  require_password_change: false,
  created_at: null,
  updated_at: null,
  ...overrides,
});

describe("required password change flow", () => {
  it("maps the login response requirement onto the authenticated user", () => {
    expect(normalizeAuthUser(user(), true).require_password_change).toBe(true);
  });

  it("redirects immediately after login while preserving a safe destination", () => {
    expect(
      getAuthenticatedDestination(
        user({ require_password_change: true }),
        "?next=%2Fusers",
      ),
    ).toBe("/change-password?next=%2Fusers");
  });

  it("redirects during restored sessions without rendering protected content", () => {
    const flaggedUser = user({ require_password_change: true });

    expect(getPasswordChangeGuardRedirect(flaggedUser, "/users")).toBe(
      "/change-password?next=%2Fusers",
    );
    expect(canRenderGuardedContent(flaggedUser, "/users")).toBe(false);
    expect(canRenderGuardedContent(flaggedUser, "/change-password")).toBe(true);
  });

  it("allows ordinary users to continue and prevents redirect loops", () => {
    expect(getAuthenticatedDestination(user(), "?next=%2Fusers")).toBe("/users");
    expect(getAuthenticatedDestination(user(), "")).toBe("/home");
    expect(
      getPasswordChangeGuardRedirect(
        user({ require_password_change: true }),
        "/change-password",
      ),
    ).toBeNull();
    expect(getRequestedDestination("?next=%2Fchange-password")).toBe("/home");
  });

  it("always uses /home as the fallback home path", () => {
    expect(getFallbackHomePath(user())).toBe("/home");
    expect(getFallbackHomePath(undefined)).toBe("/home");
  });

  it("maps the password form to the backend request contract", () => {
    expect(
      mapChangePasswordRequest({
        currentPassword: "old-password",
        password: "NewSecurePassword123!",
        passwordConfirmation: "NewSecurePassword123!",
      }),
    ).toEqual({
      current_password: "old-password",
      password: "NewSecurePassword123!",
      password_confirmation: "NewSecurePassword123!",
    });
  });

  it("handles a global 423 by flagging the session and redirecting once", () => {
    const queryClient = new QueryClient();
    const replace = vi.fn();

    queryClient.setQueryData(authQueryKeys.currentUser(), user());
    handleRequiredPasswordChange(queryClient, "/users?page=2", replace);

    expect(
      queryClient.getQueryData<User>(authQueryKeys.currentUser())
        ?.require_password_change,
    ).toBe(true);
    expect(replace).toHaveBeenCalledWith(
      "/change-password?next=%2Fusers%3Fpage%3D2",
    );

    replace.mockClear();
    handleRequiredPasswordChange(
      queryClient,
      "/change-password?next=%2Fusers",
      replace,
    );
    expect(replace).not.toHaveBeenCalled();
  });
});
