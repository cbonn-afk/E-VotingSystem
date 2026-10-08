import { apiClient } from "@/libs/api/apiClient";
import { initializeCsrf } from "@/libs/api/csrf";
import type { ChangePasswordRequest } from "@/modules/auth/schemas/changePasswordSchema";
import type { LoginInput } from "@/modules/auth/schemas/loginSchema";
import type {
  ApiResourceResponse,
  LoginResponse,
  User,
} from "@/modules/auth/types";

export const normalizeAuthUser = (
  user: Omit<User, "require_password_change"> &
    Partial<Pick<User, "require_password_change">>,
  requiresPasswordChange?: boolean,
): User => ({
  ...user,
  require_password_change:
    requiresPasswordChange ?? user.require_password_change ?? false,
});

export const authApi = {
  async login(input: LoginInput): Promise<User> {
    await initializeCsrf();

    const response = await apiClient<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: input,
    });

    return normalizeAuthUser(
      response.user ?? response.data,
      response.requires_password_change,
    );
  },

  async currentUser(): Promise<User> {
    const response = await apiClient<ApiResourceResponse<User>>("/api/auth/me");

    return normalizeAuthUser(response.data);
  },

  async changePassword(input: ChangePasswordRequest): Promise<User> {
    const response = await apiClient<ApiResourceResponse<User>>(
      "/api/auth/password",
      {
        method: "PATCH",
        body: input,
      },
    );

    return normalizeAuthUser(response.data);
  },

  async updateProfile(input: FormData): Promise<User> {
    const response = await apiClient<ApiResourceResponse<User>>(
      "/api/auth/profile",
      {
        method: "POST",
        body: input,
      },
    );

    return normalizeAuthUser(response.data);
  },

  logout(): Promise<void> {
    return apiClient<void>("/api/auth/logout", {
      method: "POST",
    });
  },
};
