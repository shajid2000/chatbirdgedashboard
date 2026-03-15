import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getAccessToken } from '@/lib/auth'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL

function createReconnectingSocket({ getUrl, onMessage, onOpen, onClose }) {
  let ws = null
  let destroyed = false

  function _clearSocket() {
    if (!ws) return
    // Remove all handlers before closing so stale events don't fire
    ws.onopen = null
    ws.onmessage = null
    ws.onclose = null
    ws.onerror = null
    if (ws.readyState !== WebSocket.CLOSED) ws.close()
    ws = null
  }

  function connect() {
    if (destroyed) return
    // Already open or mid-handshake — don't create a second socket
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return

    // If a stale / closing socket remains, clean it up before reconnecting
    if (ws) _clearSocket()

    // Fetch a fresh URL (and fresh token) on every connect attempt
    const url = getUrl()
    if (!url) return

    ws = new WebSocket(url)

    ws.onopen = () => {
      console.log('[WS] connected:', url)
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
      ws = null   // allow next connect() to create a fresh socket
      onClose?.()
    }

    ws.onerror = (e) => {
      console.warn('[WS] error', url, e)
      _clearSocket()
    }
  }

  function disconnect() {
    _clearSocket()
  }

  function destroy() {
    destroyed = true
    _clearSocket()
  }

  function send(data) {
    console.log(ws,data);
    
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
export function useChatSocket(customerId, onMessage) {
  const socketRef = useRef(null)
  const queryClient = useQueryClient()

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
          queryClient.setQueryData(['messages', customerId], (old) =>
            old ? [...old, data.message] : [data.message]
          )
          onMessage?.(data.message)
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
    console.log('[WS] sending message', { content, channelId },socketRef.current)
    socketRef.current?.send({ content, channel_id: channelId })
  }, [])

  return { sendMessage }
}

/**
 * WebSocket for the inbox sidebar.
 * Business-wide new message notifications.
 * Auto-disconnects on background, reconnects on focus.
 */
export function useInboxSocket(onUpdate) {
  const socketRef = useRef(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    socketRef.current = createReconnectingSocket({
      getUrl: () => {
        const token = getAccessToken()
        if (!token) return null
        return `${WS_URL}/ws/inbox/?token=${token}`
      },
      onMessage: (data) => {
        if (data.type === 'inbox_update') {
          queryClient.invalidateQueries({ queryKey: ['customers'] })
          onUpdate?.(data)
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
