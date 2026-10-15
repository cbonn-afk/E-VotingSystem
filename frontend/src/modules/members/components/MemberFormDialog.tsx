'use client'

import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from "@mui/material/Grid";
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'

import { membersApi } from '../api/membersApi'
import type { Member } from '../api/types'
import { memberSchema, type MemberFormValues } from '../schemas/memberSchemas'

const EMPTY: MemberFormValues = {
  member_code: '',
  name: '',
  mobile_number: '',
  birth_date: '',
  address: '',
  membership_date: '',
  status: 'active',
  is_delinquent: false
}

const toForm = (m: Member): MemberFormValues => ({
  member_code: m.member_code,
  name: m.name,
  mobile_number: m.mobile_number ?? '',
  birth_date: m.birth_date ?? '',
  address: m.address ?? '',
  membership_date: m.membership_date ?? '',
  status: m.status,
  is_delinquent: m.is_delinquent
})

type Props = { open: boolean; member: Member | null; onClose: () => void }

export default function MemberFormDialog({ open, member, onClose }: Props) {
  const qc = useQueryClient()

  const { control, handleSubmit, reset } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: EMPTY
  })

  useEffect(() => {
    if (open) reset(member ? toForm(member) : EMPTY)
  }, [open, member, reset])

  const save = useMutation({
    mutationFn: (v: MemberFormValues) => {
      const body = {
        ...v,
        birth_date: v.birth_date || null,
        membership_date: v.membership_date || null,
        address: v.address || null
      }

      return member ? membersApi.update(member.id, body) : membersApi.create(body)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] })
      onClose()
    }
  })

  const text = (name: 'member_code' | 'name' | 'mobile_number' | 'address', label: string, extra = {}) => (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField {...field} {...extra} label={label} fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
      )}
    />
  )

  const date = (name: 'birth_date' | 'membership_date', label: string) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => <TextField {...field} type='date' label={label} fullWidth slotProps={{ inputLabel: { shrink: true } }} />}
    />
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>{member ? 'Edit member' : 'Add member'}</DialogTitle>
      <DialogContent dividers>
        {save.error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {save.error.message}
          </Alert>
        )}
        <Grid container spacing={3} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, sm: 6 }}>{text('member_code', 'Member code')}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{text('name', 'Full name')}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{text('mobile_number', 'Mobile number', { placeholder: '09171234567' })}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='status'
              control={control}
              render={({ field }) => (
                <TextField {...field} select label='Status' fullWidth>
                  <MenuItem value='active'>Active</MenuItem>
                  <MenuItem value='inactive'>Inactive</MenuItem>
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{date('birth_date', 'Birth date')}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{date('membership_date', 'Member since')}</Grid>
          <Grid size={12}>{text('address', 'Address')}</Grid>
          <Grid size={12}>
            <Controller
              name='is_delinquent'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label='Delinquent'
                  control={<Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant='contained' disabled={save.isPending} onClick={handleSubmit(v => save.mutate(v))}>
          Save member
        </Button>
      </DialogActions>
    </Dialog>
  )
}
