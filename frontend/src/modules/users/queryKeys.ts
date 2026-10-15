import type { RoleListFilters, UserListFilters } from "./types";

export const userManagementKeys = {
  all: ["user-management"] as const,
  users: () => [...userManagementKeys.all, "users"] as const,
  userList: (filters: UserListFilters) =>
    [...userManagementKeys.users(), "list", filters] as const,
  user: (id: number) =>
    [...userManagementKeys.users(), "detail", id] as const,
  roles: () => [...userManagementKeys.all, "roles"] as const,
  roleCatalog: () =>
    [...userManagementKeys.roles(), "catalog"] as const,
  roleList: (filters: RoleListFilters) =>
    [...userManagementKeys.roles(), "list", filters] as const,
  role: (id: number) =>
    [...userManagementKeys.roles(), "detail", id] as const,
  permissions: () =>
    [...userManagementKeys.all, "permissions"] as const,
};
