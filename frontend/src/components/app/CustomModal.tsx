'use client'

import React from 'react'

import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import type { Breakpoint } from '@mui/material/styles'

/**
 * Custom Modal component.
 *
 * @author @talismantimpac
 * @component
 * @example
 * <CustomModal open={true} onClose={handleClose} disableEscapeKeyDown={true} closeAfterTransition={true} />
 */

type CustomModalProps = {
  disableEscapeKeyDown?: boolean
  closeAfterTransition: boolean
  open: boolean
  onClose: () => void
  maxWidth?: false | Breakpoint | undefined

  // Dialog Content
  title: string
  description?: string | React.ReactNode
  actions: React.ReactNode
}

function CustomModal({
  open,
  onClose,
  disableEscapeKeyDown,
  title,
  description,
  actions,
  closeAfterTransition,
  maxWidth
}: CustomModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      disableEscapeKeyDown={disableEscapeKeyDown}
      closeAfterTransition={closeAfterTransition}
    >
      <DialogTitle id='alert-dialog-title'>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id='alert-dialog-description'>{description}</DialogContentText>
      </DialogContent>
      <DialogActions className='dialog-actions-dense'>{actions}</DialogActions>
    </Dialog>
  )
}

export default CustomModal
