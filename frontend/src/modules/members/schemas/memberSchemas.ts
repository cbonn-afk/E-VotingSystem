import { z } from 'zod'

export const memberSchema = z.object({
  member_code: z.string().trim().min(1, 'Member code is required'),
  name: z.string().trim().min(1, 'Name is required'),
  mobile_number: z
    .string()
    .trim()
    .regex(/^(\+?63|0)?9\d{9}$/, 'Enter a valid PH mobile number, e.g. 09171234567'),
  birth_date: z.string(),
  address: z.string(),
  membership_date: z.string(),
  status: z.enum(['active', 'inactive']),
  is_delinquent: z.boolean()
})

export type MemberFormValues = z.infer<typeof memberSchema>
