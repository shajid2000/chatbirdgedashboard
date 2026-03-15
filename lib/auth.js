export function saveTokens({ access, refresh }) {
  localStorage.setItem('access_token', access)
  localStorage.setItem('refresh_token', refresh)
}

export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
}

export function saveUser(user) {
  localStorage.setItem('user', JSON.stringify(user))
}

export function getUser() {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem('user'))
  } catch {
    return null
  }
}

export function getAccessToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

export function getRefreshToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('refresh_token')
}

export function isAuthenticated() {
  return !!getAccessToken()
}
