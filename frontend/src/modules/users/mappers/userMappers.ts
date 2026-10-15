import type { UserFormValues } from "../schemas/userSchemas";
import type {
  CreateUserRequest,
  ManagedUserDto,
  UpdateUserRequest,
  UserAccount,
  UserRole,
  UserStatusDto,
} from "../types";

export const mapUserDtoToUserAccount = (
  user: ManagedUserDto,
  roles: UserRole[],
): UserAccount => {
  const roleIds = roles
    .filter((role) => user.roles.includes(role.name))
    .map((role) => role.id);

  return {
    id: user.id,
    fullName: user.name,
    email: user.email,
    avatarUrl: user.avatar_url,
    roleIds,
    roleNames: user.roles,
    permissions: user.permissions,
    modules: user.modules,
    status: user.status === "active" ? "Active" : "Inactive",
    requirePasswordChange: user.require_password_change ?? false,
    createdAt: user.created_at ?? "",
  };
};

export const mapStatusToDto = (
  status: UserFormValues["status"],
): UserStatusDto => status.toLowerCase() as UserStatusDto;

export const mapUserAccountToFormValues = (
  user?: UserAccount | null,
): UserFormValues => ({
  fullName: user?.fullName ?? "",
  email: user?.email ?? "",
  status: user?.status ?? "Active",
  roleIds: user?.roleIds ?? [],
  temporaryPassword: "",
  confirmPassword: "",
  requirePasswordChange: user?.requirePasswordChange ?? false,
  allowUnassigned: false,
});

export const mapCreateUserFormToRequest = (
  values: UserFormValues,
  roles: UserRole[],
): CreateUserRequest => ({
  name: values.fullName.trim(),
  email: values.email.trim().toLowerCase(),
  password: values.temporaryPassword,
  status: mapStatusToDto(values.status),
  roles: roles
    .filter((role) => values.roleIds.includes(role.id))
    .map((role) => role.name),
  require_password_change: values.requirePasswordChange,
});

export const mapUserFormToProfileRequest = (
  values: UserFormValues,
): UpdateUserRequest => ({
  name: values.fullName.trim(),
  email: values.email.trim().toLowerCase(),
});
