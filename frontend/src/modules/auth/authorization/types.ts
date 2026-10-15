import type { User } from "@/modules/auth/types";

import type { ModuleName, PermissionName, SystemRole } from "./constants";

export type AuthorizationUser = Pick<
  User,
  "is_super_admin" | "permissions" | "roles" | "modules"
>;

export type AuthorizationRequirement = {
  permission?: PermissionName;
  any?: readonly PermissionName[];
  all?: readonly PermissionName[];
  role?: SystemRole;
  anyRoles?: readonly SystemRole[];
  module?: ModuleName;
};

export type AuthorizationNavigationItem = AuthorizationRequirement & {
  label: string;
  href: string;
  icon: string;
};

export type AuthorizationNavigationNode = AuthorizationRequirement & {
  label: string;
  children?: readonly AuthorizationNavigationNode[];
};
