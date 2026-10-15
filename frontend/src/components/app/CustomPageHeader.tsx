// React Imports
import type { ReactNode } from 'react'

// MUI Imports
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

type CustomPageHeaderProps = {
  title: string
  description: string
  children?: ReactNode
}

const CustomPageHeader = ({ title, description, children }: CustomPageHeaderProps) => {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} className='items-start md:items-center justify-between'>
      <Stack spacing={1}>
        <Typography variant='h3'>{title}</Typography>
        <Typography variant='body1' color='text.secondary'>
          {description}
        </Typography>
      </Stack>
      {children}
    </Stack>
  )
}

export default CustomPageHeader
