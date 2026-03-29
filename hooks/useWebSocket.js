import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getAccessToken } from '@/lib/auth'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000] // ms, capped at last value

function createReconnectingSocket({ getUrl, onMessage, onOpen, onClose }) {
  let ws = null
  let destroyed = false
  let reconnectTimer = null
  let retryCount = 0
  let manualDisconnect = false  // true when disconnect() is called intentionally

  function _clearSocket() {
    if (!ws) return
    ws.onopen = null
    ws.onmessage = null
    ws.onclose = null
    ws.onerror = null
    if (ws.readyState !== WebSocket.CLOSED) ws.close()
    ws = null
  }

  function _scheduleReconnect() {
    if (destroyed || manualDisconnect) return
    const delay = RECONNECT_DELAYS[Math.min(retryCount, RECONNECT_DELAYS.length - 1)]
    retryCount++
    console.log(`[WS] reconnecting in ${delay}ms (attempt ${retryCount})`)
    reconnectTimer = setTimeout(connect, delay)
  }

  function connect() {
    if (destroyed) return
    clearTimeout(reconnectTimer)
    manualDisconnect = false

    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return
    if (ws) _clearSocket()

    const url = getUrl()
    if (!url) return

    ws = new WebSocket(url)

    ws.onopen = () => {
      console.log('[WS] connected:', url)
      retryCount = 0  // reset backoff on successful connect
      onOpen?.()
    }

    ws.onmessage = (e) => {
      try {
        onMessage?.(JSON.parse(e.data))
      } catch {
        console.warn('[WS] bad message', e.data)
      }
    }

    ws.onclose = (e) => {
      console.log('[WS] closed', e.code, url)
      ws = null
      onClose?.()
      _scheduleReconnect()
    }

    ws.onerror = (e) => {
      console.warn('[WS] error', url, e)
      _clearSocket()
    }
  }

  function disconnect() {
    manualDisconnect = true
    clearTimeout(reconnectTimer)
    _clearSocket()
  }

  function destroy() {
    destroyed = true
    clearTimeout(reconnectTimer)
    _clearSocket()
  }

  function send(data) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data))
      return true
    }
    return false
  }

  return { connect, disconnect, destroy, send }
}

/**
 * WebSocket for a specific customer chat thread.
 * Auto-disconnects when tab is hidden, reconnects on focus.
 */
export function useChatSocket(customerId, { onMessage, onTyping } = {}) {
  const socketRef = useRef(null)
  const queryClient = useQueryClient()
  const onTypingRef = useRef(onTyping)
  useEffect(() => { onTypingRef.current = onTyping })

  useEffect(() => {
    if (!customerId) return

    socketRef.current = createReconnectingSocket({
      getUrl: () => {
        const token = getAccessToken()
        if (!token) return null
        return `${WS_URL}/ws/customers/${customerId}/?token=${token}`
      },
      onMessage: (data) => {
        if (data.type === 'message') {
          queryClient.setQueryData(['messages', customerId], (old) => {
            const newMsg = data.message
            if (!old) {
              return {
                pages: [{ results: [newMsg], next: null, previous: null }],
                pageParams: [null],
              }
            }
            // Prepend to first page (newest-first order)
            const [first, ...rest] = old.pages
            return {
              ...old,
              pages: [{ ...first, results: [newMsg, ...first.results] }, ...rest],
            }
          })
          onMessage?.(data.message)
        }
        if (data.type === 'typing') {
          onTypingRef.current?.()
        }
      },
    })

    socketRef.current.connect()

    // Reconnect when tab comes back into focus
    const handleVisible = () => {
      if (document.visibilityState === 'visible') {
        console.log('[WS] tab focused — reconnecting chat')
        socketRef.current?.connect()
      } else {
        console.log('[WS] tab hidden — disconnecting chat')
        socketRef.current?.disconnect()
      }
    }

    document.addEventListener('visibilitychange', handleVisible)

    return () => {
      document.removeEventListener('visibilitychange', handleVisible)
      socketRef.current?.destroy()
    }
  }, [customerId])

  const sendMessage = useCallback((content, channelId = null) => {
    console.log('[WS] sending message', { content, channelId }, socketRef.current)
    socketRef.current?.send({ content, channel_id: channelId })
  }, [])

  const sendTyping = useCallback(() => {
    socketRef.current?.send({ type: 'typing' })
  }, [])

  return { sendMessage, sendTyping }
}

/**
 * WebSocket for the inbox sidebar.
 * Business-wide new message notifications.
 * Auto-disconnects on background, reconnects on focus.
 */
export function useInboxSocket(onUpdate) {
  const socketRef = useRef(null)
  const queryClient = useQueryClient()
  // Always call the latest callback without recreating the socket
  const onUpdateRef = useRef(onUpdate)
  useEffect(() => { onUpdateRef.current = onUpdate })

  useEffect(() => {
    socketRef.current = createReconnectingSocket({
      getUrl: () => {
        const token = getAccessToken()
        if (!token) return null
        return `${WS_URL}/ws/inbox/?token=${token}`
      },
      onMessage: (data) => {
        if (data.type === 'inbox_update') {
          const { customer_id, message } = data

          // Immediately update all ['customers', *] caches:
          // - inject _lastMessage preview
          // - update last_message_at so the row re-renders instantly
          // - bubble the customer to the top (re-sort by last_message_at desc)
          queryClient.setQueriesData({ queryKey: ['customers'] }, (old) => {
            if (!old) return old
            // Infinite query shape: { pages: [...], pageParams: [...] }
            if (old.pages) {
              // Extract the customer from wherever they are, update timestamp, move to top
              let target = null
              const cleanedPages = old.pages.map((page) => ({
                ...page,
                results: page.results.filter((c) => {
                  if (c.id === customer_id) {
                    target = { ...c, last_message_at: message.timestamp }
                    return false
                  }
                  return true
                }),
              }))
              if (!target) return old
              return {
                ...old,
                pages: cleanedPages.map((page, i) =>
                  i === 0 ? { ...page, results: [target, ...page.results] } : page
                ),
              }
            }
            return old
          })

          onUpdateRef.current?.(data)
        }

        if (data.type === 'customer_merged') {
          const { merged_ids } = data
          // Drop merged secondaries from the cache immediately
          queryClient.setQueriesData({ queryKey: ['customers'] }, (old) => {
            if (!old?.pages) return old
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                results: page.results.filter((c) => !merged_ids.includes(c.id)),
              })),
            }
          })
          queryClient.invalidateQueries({ queryKey: ['customers'] })
          onUpdateRef.current?.(data)
        }
      },
    })

    socketRef.current.connect()

    const handleVisible = () => {
      if (document.visibilityState === 'visible') {
        console.log('[WS] tab focused — reconnecting inbox')
        socketRef.current?.connect()
      } else {
        console.log('[WS] tab hidden — disconnecting inbox')
        socketRef.current?.disconnect()
      }
    }

    document.addEventListener('visibilitychange', handleVisible)

    return () => {
      document.removeEventListener('visibilitychange', handleVisible)
      socketRef.current?.destroy()
    }
  }, [])
}
