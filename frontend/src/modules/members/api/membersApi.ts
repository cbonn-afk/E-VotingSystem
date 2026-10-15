import { apiClient } from '@/libs/api/apiClient'

import type { ImportResult, Member, MemberPayload, Paginated } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const membersApi = {
  list: (p: { q?: string; page?: number; per_page?: number }) => {
    const qs = new URLSearchParams()

    if (p.q) qs.set('q', p.q)
    qs.set('page', String(p.page ?? 1))
    qs.set('per_page', String(p.per_page ?? 15))

    return apiClient<Paginated<Member>>(`/api/members?${qs}`)
  },

  create: (body: MemberPayload) => apiClient<{ data: Member }>('/api/members', { method: 'POST', body }),

  update: (id: number, body: MemberPayload) =>
    apiClient<{ data: Member }>(`/api/members/${id}`, { method: 'PATCH', body }),

  remove: (id: number) => apiClient<void>(`/api/members/${id}`, { method: 'DELETE' }),

  /** commit=false only checks the file; commit=true saves it. */
  import: async (file: File, commit: boolean) => {
    const body = new FormData()

    body.append('file', file)
    body.append('commit', commit ? '1' : '0')

    return (await apiClient<{ data: ImportResult }>('/api/members/import', { method: 'POST', body })).data
  },

  downloadTemplate: async () => {
    const response = await fetch(`${API_URL}/api/members/template`, { credentials: 'include' })

    if (!response.ok) throw new Error('The template could not be downloaded.')

    const url = URL.createObjectURL(await response.blob())
    const link = document.createElement('a')

    link.href = url
    link.download = 'members-template.xlsx'
    link.click()
    URL.revokeObjectURL(url)
  }
}
