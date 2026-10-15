'use client'

// MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

// Component Imports
import Link from '@components/Link'
import CustomAvatar from '@core/components/mui/Avatar'

// Type Imports
import type { SuperAdminModule } from '../types'

type ModuleCardProps = {
  module: SuperAdminModule
}

const ModuleCard = ({ module }: ModuleCardProps) => {
  return (
    <Card className='bs-full'>
      <CardContent className='flex flex-col gap-5 bs-full'>
        <Stack direction='row' spacing={3} className='items-start justify-between'>
          <CustomAvatar color={module.color} skin='light' size={48}>
            <i className={module.icon} />
          </CustomAvatar>

          <Box className='flex flex-col gap-2 flex-1'>
            <Typography variant='h5' color='text.primary'>
              {module.title}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {module.description}
            </Typography>
          </Box>
        </Stack>

        <Button
          component={Link}
          href={module.href}
          fullWidth
          color={module.color}
          variant='tonal'
          endIcon={<i className='bx-right-arrow-alt' />}
        >
          Open Module
        </Button>
      </CardContent>
    </Card>
  )
}

export default ModuleCard
