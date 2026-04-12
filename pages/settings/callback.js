import { useEffect, useState } from 'react'
import api from '@/lib/api'
import {
  clearPendingSourceOAuth,
  getPendingSourceOAuth,
  setSourceOAuthResult,
} from '@/lib/sourceOAuth'

/**
 * OAuth callback page.
 * Supports both:
 * 1. Legacy popup flow via window.opener + postMessage
 * 2. Default same-tab redirect flow that completes the exchange here
 */
export default function OAuthCallback() {
  const [message, setMessage] = useState('Completing authorization...')

  useEffect(() => {
    if (typeof window === 'undefined') return

    let closeTimer = null

    const run = async () => {
      const pending = getPendingSourceOAuth()
      const source = pending?.source ?? null
      const returnPath = pending?.returnPath || '/settings/channels'
      const params = new URLSearchParams(window.location.search)

      if (window.opener && source) {
        try {
          window.opener.postMessage(
            { type: 'meta_oauth_callback', url: window.location.href, source },
            window.location.origin,
          )
        } catch (_) {
          // ignore popup postMessage failures
        }
        closeTimer = setTimeout(() => window.close(), 500)
        return
      }

      if (!pending || !source) {
        setMessage('No pending connection was found. You can close this page.')
        return
      }

      if (params.get('error') === 'access_denied') {
        clearPendingSourceOAuth()
        setSourceOAuthResult({
          source,
          status: 'error',
          detail: 'Authorization was cancelled.',
        })
        setMessage('Authorization cancelled. Returning...')
        window.location.replace(returnPath)
        return
      }

      try {
        const { data } = await api.post('/sources/connect/', {
          source,
          auth_code: window.location.href,
        })
        clearPendingSourceOAuth()
        setSourceOAuthResult({
          source,
          status: 'success',
          ...data,
        })
        setMessage('Authorization complete. Returning...')
        window.location.replace(returnPath)
      } catch (error) {
        clearPendingSourceOAuth()
        setSourceOAuthResult({
          source,
          status: 'error',
          detail: error.response?.data?.detail || 'Failed to complete authorization.',
        })
        setMessage('Authorization failed. Returning...')
        window.location.replace(returnPath)
      }
    }

    run()

    return () => {
      if (closeTimer) clearTimeout(closeTimer)
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-6">
      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-base font-semibold text-gray-800 mb-1">Authorization in progress</h1>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}
