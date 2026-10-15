'use client'

import React from 'react'

import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

/**
 * Thin wrapper around the common confirmation / warning dialog pattern.
 *
 * Most ERP screens use this for issue, delete, deactivate, and similar
 * actions so dialog spacing and typography stay consistent across modules.
 */

type CustomModalProps = {
  icon?: React.ReactNode
  disableEscapeKeyDown?: boolean
  closeAfterTransition: boolean
  open: boolean
  onClose: () => void

  // Dialog Content
  title: string
  description?: string | React.ReactNode
  actions?: React.ReactNode | React.ReactNode[] | null

  children: React.ReactNode | React.ReactNode[] | null
  width?: string
}

function CustomDialog({
  icon,
  open,
  onClose,
  disableEscapeKeyDown,
  title,
  description,
  actions,
  closeAfterTransition,
  children = null,
  width
}: CustomModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      disableEscapeKeyDown={disableEscapeKeyDown}
      closeAfterTransition={closeAfterTransition}
      sx={{
        '& .MuiDialog-paper': {
          ...(width ? { inlineSize: width, maxInlineSize: 'calc(100% - 32px)' } : {})
        }
      }}
    >
      <DialogTitle id='alert-dialog-title'>
        <Box display={'flex'} alignItems={'center'} gap={1}>
          {icon}
          <Typography variant={'h4'}>{title}</Typography>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ width: '100%' }}>
        {typeof description === 'string' ? (
          <DialogContentText id='alert-dialog-description'>{description}</DialogContentText>
        ) : (
          <div id='alert-dialog-description'>{description}</div>
        )}

        {children}
      </DialogContent>
      <DialogActions className='dialog-actions-dense'>{actions}</DialogActions>
    </Dialog>
  )
}

export default CustomDialog
