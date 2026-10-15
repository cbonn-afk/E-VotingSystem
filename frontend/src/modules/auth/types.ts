export type UserStatus = "active" | "inactive";

export type ThemePreference = "light" | "dark" | "system";

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  theme_preference: ThemePreference;
  email_verified_at: string | null;
  status: UserStatus;
  deactivated_at: string | null;
  is_super_admin: boolean;
  roles: string[];
  permissions: string[];
  modules: string[];
  require_password_change: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface ApiResourceResponse<T> {
  data: T;
}

export interface LoginResponse extends ApiResourceResponse<User> {
  user?: User;
  requires_password_change?: boolean;
}
