'use client'

// React Imports
import { useState } from 'react'
import type { FormEvent } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'

const OrderLookupSearch = () => {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const search = query.trim()

    if (!search) return

    router.push(`/service?search=${encodeURIComponent(search)}`)
  }

  return (
    <Stack
      component='form'
      className='is-full mb-5'
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      onSubmit={handleSubmit}
    >
      <TextField
        fullWidth
        label='Order or barcode'
        placeholder='Search order or barcode number'
        value={query}
        onChange={event => setQuery(event.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position='start'>
                <i className='bx-search' />
              </InputAdornment>
            )
          }
        }}
      />
      <Button type='submit' variant='contained' disabled={!query.trim()}>
        Search
      </Button>
    </Stack>
  )
}

export default OrderLookupSearch
