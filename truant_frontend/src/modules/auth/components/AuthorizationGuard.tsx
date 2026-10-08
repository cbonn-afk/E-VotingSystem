'use client'

import { useEffect, type ReactNode } from 'react'

import { usePathname, useRouter } from 'next/navigation'

import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import type { AuthorizationRequirement } from '@/modules/auth/authorization/types'
import { useAuthorization } from '@/modules/auth/hooks/useAuthorization'
import { getFallbackHomePath } from '@/modules/auth/passwordChange'

type AuthorizationGuardProps = AuthorizationRequirement & {
  children: ReactNode
  redirectTo?: string
}

const defaultDeniedRedirect = (
  authorization: ReturnType<typeof useAuthorization>,
): string => getFallbackHomePath(authorization.user)

const AuthorizationGuard = ({
  children,
  redirectTo = '/home',
  ...requirement
}: AuthorizationGuardProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const authorization = useAuthorization()
  const allowed = authorization.isAuthorized(requirement)
  const deniedRedirect =
    redirectTo === '/home' ? defaultDeniedRedirect(authorization) : redirectTo

  useEffect(() => {
    if (authorization.isLoading || allowed || pathname === deniedRedirect) return

    router.replace(deniedRedirect)
  }, [allowed, authorization.isLoading, deniedRedirect, pathname, router])

  if (authorization.isLoading || !allowed) {
    return (
      <Box sx={{ minBlockSize: 240, display: 'grid', placeItems: 'center' }}>
        <CircularProgress size={32} />
      </Box>
    )
  }

  return children
}

export default AuthorizationGuard
