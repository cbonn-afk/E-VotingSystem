'use client'

// ── Shared kanban visual language ───────────────────────────────────────────
// Extracted from ProductionUnitDashboardView's OrderCard / ColumnHeader /
// EmptyColumn so every inner-stage dialog (Production, Packaging, QC,
// Tailoring) renders its unit cards and columns with the same look:
//   • flat Card shell (elevation 0, 1px divider border, radius 2, soft hover)
//   • a small soft-tint Chip "tag pill" for the current stage instead of a
//     solid colour header band
//   • column headers = title + count Chip (bgcolor action.hover) + kebab dot
//   • empty columns = centered icon + "No … here" caption

import type { ReactNode } from 'react'

import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'

export const KANBAN_COLUMN_MIN_WIDTH = 248

export const kanbanBoardSx = {
  width: '100%',
  overflowX: 'auto',
  overflowY: 'visible',
  pb: 2,
}

export const kanbanTrackSx = (columnCount: number) => ({
  display: 'flex',
  alignItems: 'stretch',
  minWidth: {
    xs: columnCount * 272,
    md: `max(100%, ${columnCount * KANBAN_COLUMN_MIN_WIDTH}px)`,
  },
})

export const kanbanColumnSx = (index: number, active = false) => ({
  flex: '1 1 0',
  minWidth: { xs: 272, md: KANBAN_COLUMN_MIN_WIDTH },
  px: { xs: 1.5, sm: 2 },
  borderLeft: index > 0 ? '1px solid' : 'none',
  borderColor: 'rgba(148, 163, 184, 0.14)',
  bgcolor: active ? 'action.selected' : 'transparent',
  transition: 'background-color 0.15s ease',
})

// Soft tag-chip colour pair, derived from a hex accent — mirrors STAGE_TAG
// in ProductionUnitDashboardView (14% tint background, darker text).
export const tagTint = (accentHex: string) => ({
  bg: `${accentHex}24`, // ~14% alpha tint
  color: accentHex,
})

interface StageTagChipProps {
  label: string
  accent: string
  size?: 'small'
}

// The soft rounded pill used for "current stage" / status labels — same
// shape & sizing as the dashboard's tag pills (height 22, 0.68rem, weight 600).
export const StageTagChip = ({ label, accent }: StageTagChipProps) => (
  <Chip
    label={label}
    size='small'
    sx={{
      height: 24,
      fontSize: '0.72rem',
      fontWeight: 600,
      borderRadius: 1,
      bgcolor: `${accent}1f`,
      color: accent,
      '& .MuiChip-label': { px: 1.1 },
    }}
  />
)

interface KanbanColumnHeaderProps {
  label: string
  count: number
  accent: string
  icon?: string
  isHovering?: boolean
  isValidDrop?: boolean
  trailing?: ReactNode
}

// Column header matching ProductionUnitDashboardView's ColumnHeader:
// title on the left, a neutral count Chip + kebab dot on the right — with a
// restrained accent title and count badge, plus a success state while a valid
// drag-drop is hovering over the column.
export const KanbanColumnHeader = ({ label, count, accent, icon, isHovering, isValidDrop, trailing }: KanbanColumnHeaderProps) => (
  <Box
    sx={{
      mb: 2,
      px: 0.5,
      py: 0.5,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 1,
      transition: 'color 0.15s ease',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
      {icon && <i className={icon} style={{ fontSize: 15, color: isHovering ? 'var(--mui-palette-success-main)' : accent, flexShrink: 0 }} />}
      <Typography variant='h6' noWrap sx={{ fontWeight: 700, fontSize: '0.9rem', color: isHovering ? 'success.main' : accent }}>
        {label}
      </Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.65, flexShrink: 0 }}>
      <Chip
        label={count}
        size='small'
        sx={{
          height: 20,
          minWidth: 22,
          fontSize: '0.68rem',
          fontWeight: 700,
          borderRadius: 1,
          bgcolor: isHovering ? 'success.main' : accent,
          color: 'common.white',
          '& .MuiChip-label': { px: 0.75 },
        }}
      />
      {trailing}
      <i className='bx-dots-vertical-rounded' style={{ fontSize: 17, color: 'var(--mui-palette-text-disabled)', opacity: 0.65 }} />
    </Box>
  </Box>
)

interface KanbanEmptyStateProps {
  icon: string
  accent?: string
  isValidDrop?: boolean
  label?: string
}

// Empty-column placeholder matching ProductionUnitDashboardView's EmptyColumn
// (faint icon + disabled caption), with an optional "ready to receive" tint
// while a valid drag is in progress.
export const KanbanEmptyState = ({ icon, accent, isValidDrop, label = 'Empty' }: KanbanEmptyStateProps) => (
  <Box
    sx={{
      borderRadius: 2,
      py: 4,
      px: 2,
      textAlign: 'center',
      bgcolor: isValidDrop ? theme => alpha(theme.palette.success.main, 0.06) : 'transparent',
    }}
  >
    <i
      className={icon}
      style={{
        fontSize: 20,
        color: isValidDrop ? 'var(--mui-palette-success-main)' : 'var(--mui-palette-text-disabled)',
        display: 'block',
        marginBottom: 6,
        opacity: isValidDrop ? 1 : 0.5,
      }}
    />
    <Typography variant='caption' sx={{ color: isValidDrop ? 'success.main' : 'text.disabled', fontWeight: isValidDrop ? 700 : 400, fontSize: '0.72rem' }}>
      {isValidDrop ? 'Ready to receive' : label}
    </Typography>
  </Box>
)

interface KanbanDropHintProps {
  label?: string
}

// "Drop here" affordance shown at the top of a column while hovering —
// matches the dashboard's soft-success styling.
export const KanbanDropHint = ({ label = 'Drop here' }: KanbanDropHintProps) => (
  <Box sx={{
    border: '1.5px dashed', borderColor: 'success.main', borderRadius: 1.5, p: 1, textAlign: 'center',
    bgcolor: theme => alpha(theme.palette.success.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
  }}>
    <i className='bx-download' style={{ color: 'var(--mui-palette-success-main)', fontSize: 14 }} />
    <Typography variant='caption' sx={{ color: 'success.main', fontWeight: 700, fontSize: '0.7rem' }}>{label}</Typography>
  </Box>
)

// Card shell sx — flat, bordered, soft hover-lift; same shape language as
// the dashboard's OrderCard (elevation 0, 1px divider border, radius 2).
// `done` swaps in the dashboard's success tint; `dragging` fades the card.
export const kanbanCardSx = (opts: { done?: boolean; dragging?: boolean; draggable?: boolean } = {}) => {
  const { done, dragging, draggable } = opts
  return {
    border: '1px solid',
    borderColor: done ? 'rgba(34,197,94,0.35)' : 'divider',
    borderRadius: 2,
    boxShadow: 'none',
    overflow: 'hidden',
    minWidth: 0,
    opacity: dragging ? 0.3 : 1,
    cursor: draggable ? 'grab' : 'default',
    userSelect: 'none' as const,
    bgcolor: done ? (theme: Theme) => alpha(theme.palette.success.main, 0.06) : 'background.paper',
    transition: 'box-shadow 0.2s, opacity 0.15s',
    '&:active': draggable ? { cursor: 'grabbing' } : {},
    '&:hover': done ? {} : { boxShadow: '0 3px 12px rgba(0,0,0,0.09)' },
  }
}

// Small circular unit-number badge, tinted by the current stage accent —
// pairs with the StageTagChip inside a card's header row.
export const UnitNoBadge = ({ n, accent, done }: { n: number; accent: string; done?: boolean }) => (
  <Box sx={{
    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
    background: done ? '#22c55e' : accent,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{n}</Typography>
  </Box>
)

interface KanbanCardHeaderProps {
  unitNo: number
  accent: string
  stageLabel: string
  done?: boolean
  doneLabel?: string
  remark?: string | null
  trailing?: ReactNode
}

// Full header row for a unit card: badge + tag pill (left), optional
// trailing affordance — drag handle / lock icon / done check (right).
// This replaces the old "solid colour band" headers used in every dialog.
export const KanbanCardHeader = ({ unitNo, accent, stageLabel, done, doneLabel = 'Complete', remark, trailing }: KanbanCardHeaderProps) => (
  <Box sx={{ px: 1.5, pt: 1.5, pb: 1.1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
      <UnitNoBadge n={unitNo} accent={accent} done={done} />
      <StageTagChip label={done ? doneLabel : stageLabel} accent={done ? '#15803d' : accent} />
      {remark && !done && (
        <i className='bx-error-circle' style={{ color: '#f59e0b', fontSize: 13, flexShrink: 0 }} />
      )}
    </Box>
    {trailing}
  </Box>
)

interface KanbanProgressProps {
  value: number
  completed: number
  total: number
  label?: string
  accent?: string
}

export const KanbanProgress = ({
  value,
  completed,
  total,
  label = 'Overall unit completion',
  accent = '#696cff',
}: KanbanProgressProps) => {
  const allDone = total > 0 && completed === total

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        px: { xs: 1.5, sm: 2 },
        py: 1.25,
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 0.75 }}>
        <Typography variant='body2' sx={{ color: 'text.secondary', fontSize: '0.76rem', fontWeight: 700 }}>
          {label}
        </Typography>
        <Typography variant='body2' sx={{ color: allDone ? 'success.main' : 'text.primary', fontSize: '0.76rem', fontWeight: 700 }}>
          {completed} / {total} units done
        </Typography>
      </Box>
      <LinearProgress
        variant='determinate'
        value={Math.max(0, Math.min(100, value))}
        sx={{
          height: 7,
          borderRadius: 1,
          bgcolor: 'action.hover',
          '& .MuiLinearProgress-bar': {
            borderRadius: 1,
            bgcolor: allDone ? 'success.main' : accent,
          },
        }}
      />
    </Box>
  )
}
