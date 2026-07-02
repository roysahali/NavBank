const BASE_URL = '/api'

// sessionStorage: per-tab isolated — each browser tab has its own independent session.
// This lets admin and customer be logged in simultaneously in separate tabs.
function getToken(): string | null {
  return sessionStorage.getItem('token')
}

export function getAuthHeader(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const FROZEN_KEYWORDS = ['frozen', 'dormant', 'suspended', 'freeze']

function isFrozenError(message: string): boolean {
  const lower = message.toLowerCase()
  return FROZEN_KEYWORDS.some(k => lower.includes(k))
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    const message: string = err.detail ?? 'Request failed'
    if (isFrozenError(message)) {
      window.dispatchEvent(new CustomEvent('account-frozen', { detail: { message } }))
    }
    throw new Error(message)
  }

  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
}
