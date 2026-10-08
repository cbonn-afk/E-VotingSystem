import type { ModuleName, PermissionName, SystemRole } from './constants'
import type {
  AuthorizationNavigationNode,
  AuthorizationRequirement,
  AuthorizationUser
} from './types'

type MaybeUser = AuthorizationUser | null | undefined

export const can = (user: MaybeUser, permission: PermissionName): boolean =>
  Boolean(user && (user.is_super_admin || user.permissions.includes(permission)))

export const cannot = (user: MaybeUser, permission: PermissionName): boolean => !can(user, permission)

export const canAny = (user: MaybeUser, permissions: readonly PermissionName[]): boolean => {
  if (!user || permissions.length === 0) return false
  if (user.is_super_admin) return true

  return permissions.some(permission => user.permissions.includes(permission))
}

export const canAll = (user: MaybeUser, permissions: readonly PermissionName[]): boolean => {
  if (!user || permissions.length === 0) return false
  if (user.is_super_admin) return true

  return permissions.every(permission => user.permissions.includes(permission))
}

export const hasRole = (user: MaybeUser, role: SystemRole): boolean =>
  Boolean(user?.roles.includes(role))

export const hasAnyRole = (user: MaybeUser, roles: readonly SystemRole[]): boolean =>
  Boolean(user && roles.length > 0 && roles.some(role => user.roles.includes(role)))

export const canAccessModule = (user: MaybeUser, module: ModuleName): boolean =>
  Boolean(user && (user.is_super_admin || user.modules.includes(module)))

/**
 * True when a non-admin user can reach exactly one module. Such users have no
 * home launcher to return to, so the sidebar's System/Home link is redundant.
 */
export const hasSingleModuleAccess = (user: MaybeUser): boolean => {
  if (!user || user.is_super_admin) return false

  return new Set(user.modules).size === 1
}

export const shouldShowSystemHomeLink = (user: MaybeUser): boolean =>
  Boolean(user && !hasSingleModuleAccess(user))

export const isAuthorized = (user: MaybeUser, requirement: AuthorizationRequirement): boolean => {
  if (!user) return false

  const checks = [
    requirement.permission ? can(user, requirement.permission) : true,
    requirement.any ? canAny(user, requirement.any) : true,
    requirement.all ? canAll(user, requirement.all) : true,
    requirement.role ? hasRole(user, requirement.role) : true,
    requirement.anyRoles ? hasAnyRole(user, requirement.anyRoles) : true,
    requirement.module ? canAccessModule(user, requirement.module) : true
  ]

  return checks.every(Boolean)
}

export const filterAuthorizedItems = <T extends AuthorizationRequirement>(
  user: MaybeUser,
  items: readonly T[]
): T[] => items.filter(item => isAuthorized(user, item))

export const filterAuthorizedNavigation = <T extends AuthorizationNavigationNode>(
  user: MaybeUser,
  items: readonly T[]
): T[] =>
  items.flatMap(item => {
    const children = item.children
      ? filterAuthorizedNavigation(user, item.children)
      : undefined
    const hasChildren = Boolean(item.children)
    const keepItem = isAuthorized(user, item) && (!hasChildren || Boolean(children?.length))

    return keepItem
      ? [{ ...item, ...(children ? { children } : {}) } as T]
      : []
  })
