'use client'

import React from 'react'

import { Drawer, Stack, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'

export type CustomDrawerProps = {
  open: boolean
  onClose: () => void

  //   UI Options
  title?: React.ReactNode
  subtitle?: React.ReactNode
  showCloseButton?: boolean
  showHeaderDivider?: boolean

  //   Layout
  width?: number | string
  anchor?: 'left' | 'right' | 'top' | 'bottom'
  keepMountedOnMobile?: boolean

  // Drawer children/content
  children: React.ReactNode
}

/**
 * Standard right-side drawer shell for create/edit flows.
 *
 * Feature forms pass their own content in, but the header, width handling, and
 * close affordance stay consistent so operators do not have to relearn each
 * module.
 */
function CustomDrawer({
  open,
  onClose,
  title,
  subtitle,
  showCloseButton = true,
  showHeaderDivider = true,
  width = 600,
  anchor = 'right',
  keepMountedOnMobile = true,
  children
}: CustomDrawerProps) {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))

  // We keep the persistent behavior on both breakpoints for now so form-heavy
  // drawers do not unexpectedly reset when the viewport changes mid-edit.
  const variant: 'persistent' | 'temporary' = isDesktop ? 'persistent' : 'persistent'

  return (
    <Drawer
      variant={variant}
      anchor={anchor}
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: keepMountedOnMobile
      }}
      sx={{ width: width }}
    >
      {(title || subtitle || showCloseButton) && (
        <Stack direction={'row'} spacing={20} sx={{ p: 6 }} justifyContent={'space-between'}>
          <Stack>
            {title && (
              <Typography variant='h4' sx={{ lineHeight: 1.2 }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant='body1' color='text.secondary'>
                {subtitle}
              </Typography>
            )}
          </Stack>
          {showCloseButton && (
            <IconButton onClick={onClose} size='large'>
              <i className='bx bx-x' />
            </IconButton>
          )}
        </Stack>
      )}
      {showHeaderDivider && <Divider sx={{ mt: 1.5 }} />}
      <Box
        sx={{
          width: width,
          overflow: 'auto',
          height: '100%'
        }}
      >
        {children}
      </Box>
    </Drawer>
  )
}

export default CustomDrawer
