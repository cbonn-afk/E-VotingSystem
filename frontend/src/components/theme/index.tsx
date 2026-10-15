'use client'

// React Imports
import { useMemo } from 'react'

// MUI Imports
import { deepmerge } from '@mui/utils'
import { ThemeProvider, lighten, darken, createTheme } from '@mui/material/styles'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import CssBaseline from '@mui/material/CssBaseline'
import type {} from '@mui/material/themeCssVarsAugmentation' //! Do not remove this import otherwise you will get type errors while making a production build
import type {} from '@mui/lab/themeAugmentation' //! Do not remove this import otherwise you will get type errors while making a production build

// Third-party Imports
import { useMedia } from 'react-use'
import stylisRTLPlugin from 'stylis-plugin-rtl'

// Type Imports
import type { ChildrenType, Direction, SystemMode } from '@core/types'

// Component Imports
import ModeChanger from './ModeChanger'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

// Core Theme Imports
import defaultCoreTheme from '@core/theme'

type Props = ChildrenType & {
  direction: Direction
  systemMode: SystemMode
}

const CustomThemeProvider = (props: Props) => {
  // Props
  const { children, direction, systemMode } = props

  // Hooks
  const { settings } = useSettings()
  const isDark = useMedia('(prefers-color-scheme: dark)', systemMode === 'dark')

  // Vars
  const isServer = typeof window === 'undefined'
  let currentMode: SystemMode

  if (isServer) {
    currentMode = systemMode
  } else {
    if (settings.mode === 'system') {
      currentMode = isDark ? 'dark' : 'light'
    } else {
      currentMode = settings.mode as SystemMode
    }
  }

  // Merge the primary color scheme override with the core theme
  const theme = useMemo(() => {
    const primaryColor = settings.primaryColor as string

    const newTheme = {
      colorSchemes: {
        light: {
          palette: {
            primary: {
              main: primaryColor,
              light: lighten(primaryColor, 0.2),
              dark: darken(primaryColor, 0.1),
              contrastText: '#0F1E3C'
            },
            secondary: {
              main: '#0F1E3C',
              light: '#2B4170',
              dark: '#08132A',
              contrastText: '#FFFFFF'
            },
            background: {
              default: '#FBF8F0',
              paper: '#FFFFFF',
              paperChannel: '255 255 255'
            },
            customColors: {
              bodyBg: '#FBF8F0',
              chatBg: '#FDFBF6',
              tableHeaderBg: '#F6F0E0'
            }
          }
        },
        dark: {
          palette: {
            primary: {
              main: primaryColor,
              light: lighten(primaryColor, 0.2),
              dark: darken(primaryColor, 0.1),
              contrastText: '#0F1E3C'
            },
            secondary: {
              main: '#7C93C3',
              light: '#9DB0D6',
              dark: '#5F78AB',
              contrastText: '#08132A'
            },
            background: {
              default: '#0A1428',
              paper: '#111F3B',
              paperChannel: '17 31 59'
            },
            customColors: {
              bodyBg: '#0A1428',
              chatBg: '#0E1A33',
              tableHeaderBg: '#18284A'
            }
          }
        }
      },
      cssVariables: {
        colorSchemeSelector: 'data'
      }
    }

    const coreTheme = deepmerge(defaultCoreTheme(settings, currentMode, direction), newTheme)

    return createTheme(coreTheme)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.primaryColor, settings.skin, currentMode])

  return (
    <AppRouterCacheProvider
      options={{
        prepend: true,
        ...(direction === 'rtl' && {
          key: 'rtl',
          stylisPlugins: [stylisRTLPlugin]
        })
      }}
    >
      <ThemeProvider
        theme={theme}
        defaultMode={systemMode}
        modeStorageKey={`${themeConfig.templateName.toLowerCase().split(' ').join('-')}-mui-template-mode`}
        forceThemeRerender
      >
        <>
          <ModeChanger systemMode={systemMode} />
          <CssBaseline />
          {children}
        </>
      </ThemeProvider>
    </AppRouterCacheProvider>
  )
}

export default CustomThemeProvider
