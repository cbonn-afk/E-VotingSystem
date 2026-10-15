'use client'

import type { ReactNode } from 'react'

import { usePathname } from 'next/navigation'

import { getRoutePolicy } from '@/modules/auth/authorization/routePolicies'

import AuthorizationGuard from './AuthorizationGuard'

const RoutePermissionGuard = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname()
  const policy = getRoutePolicy(pathname)

  if (!policy) return children

  return <AuthorizationGuard {...policy}>{children}</AuthorizationGuard>
}

export default RoutePermissionGuard
