import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { authQueryKeys } from "@/modules/auth/queryKeys";
import { authApi } from "@/modules/auth/services/authApi";
import type { User } from "@/modules/auth/types";

import { useChangePassword } from "./useChangePassword";

const changedUser: User = {
  id: 1,
  name: "ERP User",
  email: "user@example.com",
  phone: null,
  address: null,
  avatar_url: null,
  theme_preference: "system",
  email_verified_at: null,
  status: "active",
  deactivated_at: null,
  is_super_admin: false,
  has_employee_profile: false,
  roles: [],
  permissions: [],
  modules: [],
  require_password_change: false,
  created_at: null,
  updated_at: null,
};

describe("useChangePassword", () => {
  it("updates authenticated-user state after a successful password change", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const changePassword = vi
      .spyOn(authApi, "changePassword")
      .mockResolvedValue(changedUser);
    const { result } = renderHook(() => useChangePassword(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        current_password: "old-password",
        password: "NewSecurePassword123!",
        password_confirmation: "NewSecurePassword123!",
      });
    });

    expect(changePassword).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(authQueryKeys.currentUser())).toEqual(
      changedUser,
    );
  });
});
