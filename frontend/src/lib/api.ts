const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

function getHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

// Auth
export const login = (email: string, password: string) =>
  request<{ token: string; user: { id: string; email: string; role: string; name: string } }>(
    '/api/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) }
  )

// Captures — upload (multipart, no JSON headers)
export async function uploadCapture(formData: FormData) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${BASE_URL}/api/captures/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data
}

// Captures — list with optional filters
export const getCaptures = (params?: Record<string, string>) => {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return request<{ captures: unknown[]; total: number }>(`/api/captures${query}`)
}

// Captures — single
export const getCapture = (id: string) =>
  request<{ capture: unknown; fields: unknown[]; events: unknown[] }>(`/api/captures/${id}`)

// Captures — correct a field
export const correctField = (captureId: string, field_name: string, new_value: string) =>
  request(`/api/captures/${captureId}/fields`, {
    method: 'PATCH',
    body: JSON.stringify({ field_name, new_value }),
  })

// Captures — change status (approve / reject / escalate)
export const updateCaptureStatus = (captureId: string, status: string, note?: string) =>
  request(`/api/captures/${captureId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note }),
  })

// Captures — export CSV (returns raw text, not JSON)
export async function exportCaptures(params?: Record<string, string>): Promise<string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  const res = await fetch(`${BASE_URL}/api/captures/export${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('Export failed')
  return res.text()
}

// Dashboard stats
export const getDashboardStats = () =>
  request<{ total: number; pending: number; approved: number; rejected: number; avgConfidence: number }>(
    '/api/dashboard/stats'
  )
