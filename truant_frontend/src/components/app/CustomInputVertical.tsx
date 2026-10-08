'use client'

import React, { useMemo, useState } from 'react'

import Grid from '@mui/material/Grid'
import classnames from 'classnames'

import CustomInputVertical from '@core/components/custom-inputs/Vertical'
import type { CustomInputVerticalData } from '@core/components/custom-inputs/types'

export type VerticalOption = CustomInputVerticalData & {
  isSelected?: boolean
  gridProps?: { size?: { xs?: number; sm?: number; md?: number; lg?: number } }
  color?: 'success' | 'error' | 'warning' | 'secondary' | 'primary' | 'info'
}

type CustomVerticalCheckboxIconProps = {
  items: VerticalOption[]
  name?: string

  // Controlled checkbox mode (optional)
  value?: string[]
  onChange?: (next: string[]) => void

  // Uncontrolled checkbox mode (optional)
  defaultValue?: string[]

  // Read-only behavior (optional)
  isDisabled?: (item: VerticalOption) => boolean

  // Layout
  gridProps?: { size?: { xs?: number; sm?: number; md?: number; lg?: number } }
  compact?: boolean
  iconSize?: number
  spacing?: number

  // If false, renders as non-interactive “cards” (no checkbox UI)
  showCheckbox?: boolean
}

function CustomVerticalCheckboxIcon({
  items,
  name = 'custom-vertical-input',
  value,
  onChange,
  defaultValue,
  isDisabled,
  gridProps,
  compact = false,
  iconSize,
  spacing,
  showCheckbox = true
}: CustomVerticalCheckboxIconProps) {
  const computedIconSize = iconSize ?? (compact ? 20 : 28)
  const computedSpacing = spacing ?? (compact ? 2 : 4)

  const initialSelected = useMemo(() => {
    if (defaultValue) return defaultValue

    return items.filter(i => i.isSelected).map(i => i.value)
  }, [defaultValue, items])

  const [internalSelected, setInternalSelected] = useState<string[]>(initialSelected)
  const selected = value ?? internalSelected

  const handleCheckboxChange = (val: string) => {
    const item = items.find(i => i.value === val)

    if (item && isDisabled?.(item)) return

    const next = selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]

    if (value === undefined) setInternalSelected(next)
    onChange?.(next)
  }

  return (
    <Grid container spacing={computedSpacing}>
      {items.map((item, index) => {
        const asset =
          item.asset && typeof item.asset === 'string' ? (
            <i className={classnames(item.asset)} style={{ fontSize: computedIconSize }} />
          ) : (
            item.asset
          )

        const resolvedGridProps = item.gridProps ?? gridProps ?? { size: { xs: 12, sm: compact ? 6 : 4 } }

        if (showCheckbox) {
          return (
            <CustomInputVertical
              key={item.value ?? index}
              type='checkbox'
              selected={selected}
              data={{ ...item, asset }}
              handleChange={handleCheckboxChange}
              name={name}
              color={item.color}
              gridProps={resolvedGridProps}
            />
          )
        }

        return (
          <CustomInputVertical
            key={item.value ?? index}
            type='radio'
            selected='' // nothing selected
            data={{ ...item, asset }}
            handleChange={() => {}} // no-op
            name={name}
            color={item.color}
            gridProps={resolvedGridProps}
          />
        )
      })}
    </Grid>
  )
}

export default CustomVerticalCheckboxIcon
