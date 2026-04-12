const PENDING_KEY = 'source_oauth_pending'
const RESULT_KEY = 'source_oauth_result'

export function setPendingSourceOAuth(data) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(data))
}

export function getPendingSourceOAuth() {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(PENDING_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearPendingSourceOAuth() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(PENDING_KEY)
}

export function setSourceOAuthResult(data) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(RESULT_KEY, JSON.stringify(data))
}

export function getSourceOAuthResult() {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(RESULT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearSourceOAuthResult() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(RESULT_KEY)
}
