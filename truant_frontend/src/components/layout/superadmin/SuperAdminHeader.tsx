'use client'

// Next Imports
import { usePathname } from 'next/navigation'

// MUI Imports
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'

// Component Imports
import Link from '@components/Link'
import Logo from '@components/layout/shared/Logo'
import HeaderNotifications from '@components/layout/shared/HeaderNotifications'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import UserDropdown from '@components/layout/shared/UserDropdown'
import Navbar from '@layouts/components/horizontal/Navbar'
import LayoutHeader from '@layouts/components/horizontal/Header'
import { useAuthorization } from '@/modules/auth/hooks/useAuthorization'

// Util Imports
import { horizontalLayoutClasses } from '@layouts/utils/layoutClasses'

const SuperAdminHeader = () => {
  const pathname = usePathname()
  const authorization = useAuthorization()
  const showHomeButton = pathname !== '/home' && authorization.shouldShowSystemHomeLink

  return (
    <LayoutHeader>
      <Navbar>
        <div className={`${horizontalLayoutClasses.navbarContent} flex items-center justify-between gap-4 is-full`}>
          <Stack direction='row' spacing={3} className='items-center'>
            <Logo />
          </Stack>

          <Stack direction='row' spacing={2} className='items-center'>
            {showHomeButton && (
              <Tooltip title='Back to Home'>
                <IconButton component={Link} href='/home' aria-label='Back to Home'>
                  <i className='bx bx-left-arrow-alt' />
                </IconButton>
              </Tooltip>
            )}
            <ModeDropdown />
            <HeaderNotifications />
            <UserDropdown />
          </Stack>
        </div>
      </Navbar>
    </LayoutHeader>
  )
}

export default SuperAdminHeader
