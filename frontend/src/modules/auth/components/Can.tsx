'use client'

import type { ReactNode } from 'react'

import type { AuthorizationRequirement } from '@/modules/auth/authorization/types'
import { useAuthorization } from '@/modules/auth/hooks/useAuthorization'

type CanProps = AuthorizationRequirement & {
  children: ReactNode
  fallback?: ReactNode
}

const Can = ({ children, fallback = null, ...requirement }: CanProps) => {
  const authorization = useAuthorization()

  if (authorization.isLoading) return null

  return authorization.isAuthorized(requirement) ? children : fallback
}

export default Can
