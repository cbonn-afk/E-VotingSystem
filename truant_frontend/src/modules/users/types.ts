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
export type AccountType = "System" | "Employee" | "Partner";
export type EmployeeWorkspace = {
  role: string;
  label: string;
  module: string;
  home_path: string;
};

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
  employee_workspace: EmployeeWorkspace | null;
  account_type?: AccountType;
  require_password_change?: boolean;
  created_at: string | null;
  updated_at: string | null;
  employee?: {
    id: string;
    employee_no: string;
    name: string;
    job_position: string | null;
    employment_type: string | null;
  } | null;
  partner?: {
    id: string;
    partner_no: string;
    name: string;
    status: "Active" | "Inactive";
  } | null;
};
export type UnlinkedEmployeeOption = {
  id: string;
  employeeNo: string;
  name: string;
  jobPosition: string | null;
  employmentType: string | null;
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
  password_confirmation: string;
  status: UserStatusDto;
  account_type: AccountType;
  roles: string[];
  require_password_change: boolean;
};

export type UpdateUserRequest = {
  name?: string;
  email?: string;
  require_password_change?: boolean;
  account_type?: AccountType;
};

export type UpdateUserStatusRequest = {
  status: UserStatusDto;
};

export type SyncUserRolesRequest = {
  roles: string[];
};

export type ResetUserPasswordRequest = {
  password: string;
  password_confirmation: string;
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
  /** Excludes users already linked to a partner profile — partners are not importable as employees. */
  excludePartners?: boolean;
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
  employeeWorkspace: EmployeeWorkspace | null;
  accountType: AccountType;
  status: UserAccountStatus;
  requirePasswordChange: boolean;
  createdAt: string;
  linkedEmployee: {
    id: string;
    employeeNo: string;
    name: string;
    jobPosition: string | null;
    employmentType: string | null;
  } | null;
  linkedPartner: {
    id: string;
    partnerNo: string;
    name: string;
    status: "Active" | "Inactive";
  } | null;
};

export type UserManagementStatsData = {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalRoles: number;
};
