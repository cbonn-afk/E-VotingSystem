export type MemberStatus = 'active' | 'inactive'

export type Member = {
  id: number
  member_code: string
  name: string
  mobile_number: string | null
  birth_date: string | null
  address: string | null
  membership_date: string | null
  status: MemberStatus
  is_delinquent: boolean
}

export type MemberPayload = Omit<Member, 'id'>

export type Paginated<T> = {
  data: T[]
  meta: { current_page: number; per_page: number; total: number; last_page: number }
}

export type ImportResult = {
  total: number
  created: number
  updated: number
  errors: { row: number; message: string }[]
  committed: boolean
  fatal: string | null
}
