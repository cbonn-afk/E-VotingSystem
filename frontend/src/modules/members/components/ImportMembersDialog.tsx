'use client'

import { useState } from 'react'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

import { membersApi } from '../api/membersApi'
import type { ImportResult } from '../api/types'
import ImportHelpDialog from './ImportHelpDialog'

type Props = { open: boolean; onClose: () => void }

export default function ImportMembersDialog({ open, onClose }: Props) {
  const qc = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)

  const reset = () => {
    setFile(null)
    setResult(null)
    setError(null)
  }

  const run = useMutation({
    mutationFn: (commit: boolean) => membersApi.import(file as File, commit),
    onSuccess: r => {
      setError(null)
      setResult(r)
      if (r.committed) qc.invalidateQueries({ queryKey: ['members'] })
    },
    onError: (e: Error) => setError(e.message)
  })

  const close = () => {
    reset()
    onClose()
  }

  const importable = result ? result.created + result.updated : 0

  return (
    <>
      <Dialog open={open} onClose={close} maxWidth='sm' fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Import members
          <IconButton aria-label='How to prepare the file' onClick={() => setHelpOpen(true)}>
            <i className='bx bx-help-circle' />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {result?.committed ? (
            <Alert severity='success'>
              Done. {result.created} added, {result.updated} updated, {result.errors.length} skipped.
            </Alert>
          ) : (
            <>
              <Button variant='outlined' component='label'>
                {file ? 'Choose a different file' : 'Choose file'}
                <input
                  hidden
                  type='file'
                  accept='.xlsx,.xls,.csv'
                  onChange={e => {
                    setFile(e.target.files?.[0] ?? null)
                    setResult(null)
                    setError(null)
                  }}
                />
              </Button>
              {file && <Typography sx={{ mt: 2 }}>{file.name}</Typography>}
            </>
          )}

          {error && (
            <Alert severity='error' sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {result && !result.committed && (
            <>
              <Alert severity={importable > 0 ? 'info' : 'warning'} sx={{ mt: 2 }}>
                {result.total} rows checked: {result.created} new, {result.updated} updates, {result.errors.length} with
                errors (skipped).
              </Alert>
              {result.errors.length > 0 && (
                <ul style={{ maxHeight: 200, overflow: 'auto', paddingInlineStart: 20 }}>
                  {result.errors.map(e => (
                    <li key={e.row}>
                      <strong>Row {e.row}:</strong> {e.message}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>{result?.committed ? 'Close' : 'Cancel'}</Button>
          {!result?.committed && !result && (
            <Button variant='contained' disabled={!file || run.isPending} onClick={() => run.mutate(false)}>
              Check file
            </Button>
          )}
          {!result?.committed && result && (
            <Button variant='contained' disabled={importable === 0 || run.isPending} onClick={() => run.mutate(true)}>
              Import {importable} members
            </Button>
          )}
        </DialogActions>
      </Dialog>
      <ImportHelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  )
}
