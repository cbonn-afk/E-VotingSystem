'use client'

// React Imports
import { forwardRef } from 'react'

// MUI Imports
import type { BoxProps } from '@mui/material/Box'
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

// Third-party Imports
import DatePicker from 'react-datepicker'
import type { DatePickerProps } from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

type Props = DatePickerProps & {
  boxProps?: BoxProps
}

// Themed wrapper that re-skins react-datepicker to match the Sneat MUI theme.
// Mirrors the AppReactToastify convention: a styled(Box) that scopes the
// third-party library's CSS to MUI design tokens.
const DatePickerWrapper = styled(Box)<BoxProps>(({ theme }) => ({
  // Stretch the input to fill its container so it matches sibling fullWidth fields.
  '& .react-datepicker-wrapper, & .react-datepicker__input-container': {
    inlineSize: '100%'
  },
  '& .react-datepicker-popper': {
    zIndex: theme.zIndex.modal + 1
  },
  '& .react-datepicker': {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.body2.fontSize,
    color: 'var(--mui-palette-text-primary)',
    borderRadius: 'var(--mui-shape-borderRadius)',
    backgroundColor: 'var(--mui-palette-background-paper)',
    border: '1px solid var(--mui-palette-divider)',
    boxShadow: 'var(--mui-customShadows-lg)'
  },
  '& .react-datepicker__triangle': {
    display: 'none'
  },
  '& .react-datepicker__header': {
    paddingBlock: theme.spacing(2),
    borderBottom: '1px solid var(--mui-palette-divider)',
    backgroundColor: 'var(--mui-palette-background-paper)',
    borderStartStartRadius: 'var(--mui-shape-borderRadius)',
    borderStartEndRadius: 'var(--mui-shape-borderRadius)'
  },
  '& .react-datepicker__current-month, & .react-datepicker-time__header': {
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.body1.fontSize,
    color: 'var(--mui-palette-text-primary)'
  },
  '& .react-datepicker__day-name, & .react-datepicker__day, & .react-datepicker__time-name': {
    margin: theme.spacing(0.75),
    inlineSize: '2.25rem',
    lineHeight: '2.25rem',
    color: 'var(--mui-palette-text-primary)'
  },
  '& .react-datepicker__day-name': {
    color: 'var(--mui-palette-text-secondary)'
  },
  '& .react-datepicker__day:hover, & .react-datepicker__month-text:hover, & .react-datepicker__quarter-text:hover, & .react-datepicker__year-text:hover':
    {
      borderRadius: '50%',
      backgroundColor: 'var(--mui-palette-action-hover)'
    },
  '& .react-datepicker__day--today': {
    fontWeight: theme.typography.fontWeightMedium
  },
  '& .react-datepicker__day--selected, & .react-datepicker__day--keyboard-selected': {
    borderRadius: '50%',
    color: 'var(--mui-palette-primary-contrastText)',
    backgroundColor: 'var(--mui-palette-primary-main) !important',
    '&:hover': {
      backgroundColor: 'var(--mui-palette-primary-dark) !important'
    }
  },
  '& .react-datepicker__day--disabled': {
    color: 'var(--mui-palette-text-disabled)',
    '&:hover': {
      backgroundColor: 'transparent'
    }
  },
  '& .react-datepicker__day--outside-month': {
    color: 'var(--mui-palette-text-disabled)'
  },
  '& .react-datepicker__navigation': {
    top: theme.spacing(3),
    '&:hover *::before': {
      borderColor: 'var(--mui-palette-text-primary)'
    }
  },
  '& .react-datepicker__navigation-icon::before': {
    borderColor: 'var(--mui-palette-text-secondary)'
  },
  '& .react-datepicker__close-icon::after': {
    backgroundColor: 'var(--mui-palette-primary-main)'
  }
})) as typeof Box

const AppReactDatepicker = forwardRef<DatePicker, Props>((props, ref) => {
  const { boxProps, ...rest } = props

  return (
    <DatePickerWrapper {...boxProps}>
      <DatePicker ref={ref} {...rest} />
    </DatePickerWrapper>
  )
})

AppReactDatepicker.displayName = 'AppReactDatepicker'

export default AppReactDatepicker
