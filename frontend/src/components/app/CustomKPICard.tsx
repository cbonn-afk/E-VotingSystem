'use client'

import React from 'react'

import { Card, CardContent, type ChipPropsColorOverrides, Stack } from '@mui/material'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import Chip from '@mui/material/Chip'

import type { OverridableStringUnion } from '@mui/types'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'

type KPICardProps = {
  label: string
  value?: number | string | null
  loading?: boolean
  error?: string | null
  icon?: React.ReactElement
  iconString?: string
  iconColor?:
    | OverridableStringUnion<
        'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning',
        ChipPropsColorOverrides
      >
    | undefined
  titleColor?: string

  children?: React.ReactNode
  outerChildren?: React.ReactNode
  alignItems?: 'center' | 'flex-start' | 'flex-end'
}

function CustomKpiCard({
  label,
  value,
  loading = false,
  error = null,
  icon,
  iconString,
  titleColor,
  iconColor,
  children = null,
  outerChildren = null,
  alignItems = 'flex-start'
}: KPICardProps) {
  return (
    <Card>
      <CardContent>
        <Stack direction='row' alignItems='center' spacing={3}>
          <Chip
            color={iconColor}
            variant={'tonal'}
            icon={iconString ? <i className={`w-11 h-11 ${iconString}`} /> : icon}
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              p: 1.5,

              '& .MuiChip-label': {
                display: 'none'
              },

              '& .MuiChip-icon': {
                margin: 0
              }
            }}
          />

          <Typography variant='body1' className={'text-secondary'}>
            {label}
          </Typography>
        </Stack>

        <Stack direction='column' alignItems={alignItems} spacing={2}>
          {loading ? (
            <Skeleton width={90} height={36} />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <Typography variant='h3' fontWeight={'bold'} className={`${titleColor}`}>
                {value}
              </Typography>
              {children}
            </Box>
          )}
        </Stack>
        {outerChildren}

        {error ? (
          <Typography variant='caption' color='error' sx={{ display: 'block', mt: 0.5 }}>
            {error}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default CustomKpiCard