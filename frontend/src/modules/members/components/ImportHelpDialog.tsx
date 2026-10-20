'use client'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import { membersApi } from '../api/membersApi'

export const IMPORT_COLUMNS = [
  { name: 'member_code', required: true, format: 'Text, unique', example: 'M-0001' },
  { name: 'name', required: true, format: 'Text', example: 'Juan Dela Cruz' },
  { name: 'mobile_number', required: true, format: '09XXXXXXXXX or +639XXXXXXXXX', example: '09171234567' },
  { name: 'birth_date', required: false, format: 'YYYY-MM-DD', example: '1985-03-21' },
  { name: 'address', required: false, format: 'Text', example: 'Bayambang, Pangasinan' },
  { name: 'membership_date', required: false, format: 'YYYY-MM-DD', example: '2015-06-01' },
  { name: 'status', required: false, format: 'active or inactive (blank = active)', example: 'active' },
  { name: 'is_delinquent', required: false, format: 'yes or no (blank = no)', example: 'no' }
]

type Props = { open: boolean; onClose: () => void }

export default function ImportHelpDialog({ open, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth scroll='paper'>
      <DialogTitle>How to prepare the members file</DialogTitle>
      <DialogContent dividers>
        <Typography sx={{ mb: 3 }}>
          Use an .xlsx or .csv file. Put the column names below in the first row, spelled exactly as shown, then add one
          member per row.
        </Typography>

        <div style={{ overflowX: 'auto' }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Column</TableCell>
                <TableCell>Format</TableCell>
                <TableCell>Example</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {IMPORT_COLUMNS.map(c => (
                <TableRow key={c.name}>
                  <TableCell>
                    <code>{c.name}</code>{' '}
                    {c.required && <Chip label='Required' size='small' color='primary' variant='tonal' />}
                  </TableCell>
                  <TableCell>{c.format}</TableCell>
                  <TableCell>{c.example}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Alert severity='info' sx={{ mt: 3 }}>
          A member code that already exists is updated, not added again. Blank optional cells keep the current value.
        </Alert>
        <Alert severity='info' sx={{ mt: 2 }}>
          Every new member gets the portal password <b>Password123</b> and must change it at first sign-in. Importing
          again never resets a password the member already changed.
        </Alert>
        <Alert severity='warning' sx={{ mt: 2 }}>
          Format the mobile_number column as Text. Excel removes the leading 0 from numbers. The template already does this.
        </Alert>
        <Typography variant='body2' sx={{ mt: 2 }}>
          You see a check of every row before anything is saved. Rows with errors are skipped and listed with their row
          number.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => membersApi.downloadTemplate()}>Download template</Button>
        <Button variant='contained' onClick={onClose}>
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  )
}
