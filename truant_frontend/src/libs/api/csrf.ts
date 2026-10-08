import { ApiError } from './apiError'

const API_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured.')
}

export async function initializeCsrf(): Promise<void> {
    const response = await fetch(
        `${API_URL}/sanctum/csrf-cookie`,
        {
            credentials: 'include',
            headers: {
                Accept: 'application/json'
            }
        }
    )

    if (!response.ok) {
        throw await ApiError.fromResponse(response)
    }
}