import {
  getAllModulePresentations,
  getModulePresentation,
} from "./accessCatalog";
import type { ErpModule, UserRole } from "../types";

export const SUPER_ADMIN_ROLE = "Super Admin";

/**
 * Super Admin and Admin are operationally identical — both hold unrestricted
 * access to every module and permission. Mirrors SystemRole::fullAccessValues()
 * on the backend.
 */
export const FULL_ACCESS_ROLES: readonly string[] = [SUPER_ADMIN_ROLE, "Admin"];

export const hasSuperAdminRole = (
  roles: readonly Pick<UserRole, "name">[],
): boolean => roles.some((role) => FULL_ACCESS_ROLES.includes(role.name));

export const hasSuperAdminRoleName = (roleNames: readonly string[]): boolean =>
  roleNames.some((role) => FULL_ACCESS_ROLES.includes(role));

export const getModulesFromRoles = (
  roles: readonly Pick<UserRole, "name" | "permissionIds">[],
): ErpModule[] => {
  if (hasSuperAdminRole(roles)) return getAllModulePresentations();

  const keys = new Set(
    roles
      .flatMap((role) => role.permissionIds)
      .map((permission) => permission.split(".")[0]),
  );

  return Array.from(keys).sort().map(getModulePresentation);
};
