'use client'

import { useCallback } from 'react'

import {
  can as canUser,
  canAccessModule as canUserAccessModule,
  canAll as canUserAll,
  canAny as canUserAny,
  cannot as cannotUser,
  hasAnyRole as userHasAnyRole,
  hasRole as userHasRole,
  isAuthorized as isUserAuthorized,
  shouldShowSystemHomeLink as userShouldShowSystemHomeLink
} from '@/modules/auth/authorization/authorization'
import type { ModuleName, PermissionName, SystemRole } from '@/modules/auth/authorization/constants'
import type { AuthorizationRequirement } from '@/modules/auth/authorization/types'
import { useCurrentUser } from '@/modules/auth/hooks/useCurrentUser'

export const useAuthorization = () => {
  const currentUser = useCurrentUser()
  const user = currentUser.data

  return {
    user,
    isLoading: currentUser.isPending,
    isAuthenticated: Boolean(user),
    isSuperAdmin: user?.is_super_admin ?? false,
    shouldShowSystemHomeLink: userShouldShowSystemHomeLink(user),
    can: useCallback((permission: PermissionName) => canUser(user, permission), [user]),
    cannot: useCallback((permission: PermissionName) => cannotUser(user, permission), [user]),
    canAny: useCallback((permissions: readonly PermissionName[]) => canUserAny(user, permissions), [user]),
    canAll: useCallback((permissions: readonly PermissionName[]) => canUserAll(user, permissions), [user]),
    hasRole: useCallback((role: SystemRole) => userHasRole(user, role), [user]),
    hasAnyRole: useCallback((roles: readonly SystemRole[]) => userHasAnyRole(user, roles), [user]),
    canAccessModule: useCallback((module: ModuleName) => canUserAccessModule(user, module), [user]),
    isAuthorized: useCallback(
      (requirement: AuthorizationRequirement) => isUserAuthorized(user, requirement),
      [user]
    )
  }
}
