import type { ThemeColor } from "@core/types";

export type ApiResourceResponse<T> = {
  data: T;
};

export type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type PaginatedApiResponse<T> = {
  data: T[];
  links: Record<string, string | null>;
  meta: PaginationMeta;
};

export type UserStatusDto = "active" | "inactive";

export type ManagedUserDto = {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  status: UserStatusDto;
  deactivated_at: string | null;
  roles: string[];
  permissions: string[];
  modules: string[];
  require_password_change?: boolean;
  created_at: string | null;
  updated_at: string | null;
};
export type RoleDto = {
  id: number;
  name: string;
  is_system: boolean;
  permissions: string[];
  users_count: number;
  created_at: string | null;
  updated_at: string | null;
};

export type PermissionDto = {
  id: number;
  name: string;
  module: string;
  action: string;
};

export type CreateUserRequest = {
  name: string;
  email: string;
  password: string;
  status: UserStatusDto;
  roles: string[];
  require_password_change: boolean;
};

export type UpdateUserRequest = {
  name?: string;
  email?: string;
};

export type UpdateUserStatusRequest = {
  status: UserStatusDto;
};

export type SyncUserRolesRequest = {
  roles: string[];
};

export type ResetUserPasswordRequest = {
  password: string;
  require_password_change: boolean;
};

export type SaveRoleRequest = {
  name: string;
  permissions: string[];
};

export type UserListFilters = {
  search?: string;
  status?: UserStatusDto;
  role?: string;
  sort: "name" | "email" | "status" | "created_at" | "updated_at";
  direction: "asc" | "desc";
  page: number;
  perPage: number;
};

export type RoleListFilters = {
  search?: string;
  page: number;
  perPage: number;
};

export type UserAccountStatus = "Active" | "Inactive";
export type RoleStatus = "Active";

export type ErpModule = {
  key: string;
  label: string;
  description: string;
  icon: string;
  color: ThemeColor;
};

export type PermissionDefinition = {
  id: string;
  name: string;
  module: string;
  action: string;
  label: string;
};

export type UserRole = {
  id: number;
  name: string;
  description: string;
  permissionIds: string[];
  isSystem: boolean;
  status: RoleStatus;
  assignedUsersCount: number;
  createdAt: string;
};

export type UserAccount = {
  id: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  roleIds: number[];
  roleNames: string[];
  permissions: string[];
  modules: string[];
  status: UserAccountStatus;
  requirePasswordChange: boolean;
  createdAt: string;
};

export type UserManagementStatsData = {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalRoles: number;
};
