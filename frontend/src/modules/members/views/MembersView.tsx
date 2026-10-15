'use client'

import { useState } from 'react'

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { membersApi } from '../api/membersApi'
import type { Member } from '../api/types'
import ImportHelpDialog from '../components/ImportHelpDialog'
import ImportMembersDialog from '../components/ImportMembersDialog'
import MemberFormDialog from '../components/MemberFormDialog'

export default function MembersView() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(15)
  const [editing, setEditing] = useState<Member | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['members', q, page, perPage],
    queryFn: () => membersApi.list({ q, page: page + 1, per_page: perPage }),
    placeholderData: keepPreviousData
  })

  const remove = useMutation({
    mutationFn: (id: number) => membersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] })
  })

  const openForm = (m: Member | null) => {
    setEditing(m)
    setFormOpen(true)
  }

  return (
    <Card>
      <CardContent sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <Typography variant='h5' sx={{ flexGrow: 1 }}>
          Members
        </Typography>
        <TextField
          size='small'
          placeholder='Search code, name or mobile'
          value={q}
          onChange={e => {
            setQ(e.target.value)
            setPage(0)
          }}
        />
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Button variant='outlined' onClick={() => setImportOpen(true)}>
            Import
          </Button>
          <Tooltip title='How to prepare the file'>
            <IconButton aria-label='How to prepare the import file' onClick={() => setHelpOpen(true)}>
              <i className='bx bx-help-circle' />
            </IconButton>
          </Tooltip>
        </span>
        <Button variant='contained' onClick={() => openForm(null)}>
          Add member
        </Button>
      </CardContent>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Mobile</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align='right'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.data.map(m => (
              <TableRow key={m.id} hover>
                <TableCell>{m.member_code}</TableCell>
                <TableCell>{m.name}</TableCell>
                <TableCell>{m.mobile_number ?? '-'}</TableCell>
                <TableCell>
                  <Chip size='small' variant='tonal' label={m.status} color={m.status === 'active' ? 'success' : 'default'} />{' '}
                  {m.is_delinquent && <Chip size='small' variant='tonal' color='error' label='Delinquent' />}
                </TableCell>
                <TableCell align='right'>
                  <Button size='small' onClick={() => openForm(m)}>
                    Edit
                  </Button>
                  <Button
                    size='small'
                    color='error'
                    onClick={() => {
                      if (window.confirm(`Delete ${m.name}?`)) remove.mutate(m.id)
                    }}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography sx={{ py: 4, textAlign: 'center' }}>No members yet. Add one, or import an Excel file.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component='div'
        count={data?.meta.total ?? 0}
        page={page}
        rowsPerPage={perPage}
        rowsPerPageOptions={[15, 30, 50]}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={e => {
          setPerPage(Number(e.target.value))
          setPage(0)
        }}
      />

      <MemberFormDialog open={formOpen} member={editing} onClose={() => setFormOpen(false)} />
      <ImportMembersDialog open={importOpen} onClose={() => setImportOpen(false)} />
      <ImportHelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </Card>
  )
}
