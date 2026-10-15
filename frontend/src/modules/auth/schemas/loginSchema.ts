import { z } from 'zod'

export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, {
            error: 'Email is required.'
        })
        .max(255, {
            error: 'Email must not exceed 255 characters.'
        })
        .pipe(
            z.email({
                error: 'Enter a valid email address.'
            })
        ),

    password: z
        .string()
        .min(1, {
            error: 'Password is required.'
        })
        .max(255, {
            error: 'Password must not exceed 255 characters.'
        })
})

export type LoginInput = z.infer<typeof loginSchema>
