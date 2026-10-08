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
    employeeWorkspace: user.employee_workspace,
    accountType:
      user.account_type ??
      (user.roles.includes("Partner")
        ? "Partner"
        : user.roles.some((role) => ["Super Admin", "Admin"].includes(role))
          ? "System"
          : "Employee"),
    status: user.status === "active" ? "Active" : "Inactive",
    requirePasswordChange: user.require_password_change ?? false,
    createdAt: user.created_at ?? "",
    linkedEmployee: user.employee
      ? {
          id: user.employee.id,
          employeeNo: user.employee.employee_no,
          name: user.employee.name,
          jobPosition: user.employee.job_position,
          employmentType: user.employee.employment_type,
        }
      : null,
    linkedPartner: user.partner
      ? {
          id: user.partner.id,
          partnerNo: user.partner.partner_no,
          name: user.partner.name,
          status: user.partner.status,
        }
      : null,
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
  accountType: user?.accountType ?? "System",
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
  password_confirmation: values.confirmPassword,
  status: mapStatusToDto(values.status),
  account_type: values.accountType,
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
  require_password_change: values.requirePasswordChange,
  account_type: values.accountType,
});
