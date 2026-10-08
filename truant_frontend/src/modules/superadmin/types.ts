// Type Imports
import type { ThemeColor } from '@core/types'
import type { AuthorizationRequirement } from '@/modules/auth/authorization/types'

export type SuperAdminModule = AuthorizationRequirement & {
  title: string
  description: string
  icon: string
  color: ThemeColor
  href: string
}
