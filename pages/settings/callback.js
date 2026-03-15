import { useEffect } from 'react'

/**
 * OAuth popup callback page.
 * Meta redirects here after the user completes the OAuth flow.
 * This page posts the full URL (including ?code=...) back to the opener,
 * then closes itself.
 *
 * Configure your Meta app redirect_uri as:
 *   http://localhost:3000/settings/callback   (dev)
 *   https://yourdomain.com/settings/callback  (prod)
 */
export default function OAuthCallback() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const source = localStorage.getItem('oauth_pending_source') ?? null
      localStorage.removeItem('oauth_pending_source')
      window.opener?.postMessage(
        { type: 'meta_oauth_callback', url: window.location.href, source },
        window.location.origin,
      )
    } catch (_) {
      // opener may be on a different origin in some edge cases — ignore
    }

    // Give the parent a moment to receive the message, then close
    const t = setTimeout(() => window.close(), 500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-6">
      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-base font-semibold text-gray-800 mb-1">Authorization complete</h1>
      <p className="text-sm text-gray-500">You can close this window.</p>
    </div>
  )
}
