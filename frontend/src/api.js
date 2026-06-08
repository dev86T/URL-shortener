const BASE = ''

function authHeader() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || data?.title || 'Request failed')
  return data
}

export const api = {
  register: (email, password) => request('POST', '/api/auth/register', { email, password }),
  login:    (email, password) => request('POST', '/api/auth/login',    { email, password }),
  shorten:  (url)             => request('POST', '/api/shorten',       { url }),
  myLinks:  ()                => request('GET',  '/api/my-links'),
  myStats:  ()                => request('GET',  '/api/stats/me'),
}
