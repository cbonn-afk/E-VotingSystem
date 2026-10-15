import { permissionActionLabel } from "../data/accessCatalog";
import type { RoleFormValues } from "../schemas/roleSchemas";
import type {
  PermissionDefinition,
  PermissionDto,
  RoleDto,
  SaveRoleRequest,
  UserRole,
} from "../types";

export const mapRoleDtoToUserRole = (role: RoleDto): UserRole => ({
  id: role.id,
  name: role.name,
  description: "Description is not provided by the current API.",
  permissionIds: role.permissions,
  isSystem: role.is_system,
  status: "Active",
  assignedUsersCount: role.users_count,
  createdAt: role.created_at ?? "",
});

export const mapPermissionDtoToDefinition = (
  permission: PermissionDto,
): PermissionDefinition => ({
  id: permission.name,
  name: permission.name,
  module: permission.module,
  action: permission.action,
  label: permissionActionLabel(permission.action),
});

export const mapRoleFormToRequest = (
  values: RoleFormValues,
): SaveRoleRequest => ({
  name: values.name.trim(),
  permissions: values.permissionIds,
});
