import { useEffect, useRef, useState, useCallback } from 'react'
import { useMessages } from '@/hooks/useMessages'
import { useChatSocket } from '@/hooks/useWebSocket'
import { useCustomer } from '@/hooks/useCustomers'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import CustomerProfile from '@/components/customer/CustomerProfile'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import ChannelBadge from '@/components/shared/ChannelBadge'
import { cn } from '@/lib/utils'

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function ChatWindow({ customerId, onBack }) {
  const scrollRef = useRef(null)
  const bottomRef = useRef(null)
  const topSentinelRef = useRef(null)
  const { data: customer } = useCustomer(customerId)
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(customerId)
  // Customer typing indicator
  const [customerTyping, setCustomerTyping] = useState(false)
  const typingTimerRef = useRef(null)
  const handleCustomerTyping = useCallback(() => {
    setCustomerTyping(true)
    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => setCustomerTyping(false), 3000)
  }, [])
  useEffect(() => () => clearTimeout(typingTimerRef.current), [])

  const { sendMessage, sendTyping } = useChatSocket(customerId, { onTyping: handleCustomerTyping })

  // Profile panel: closed by default on mobile, open on desktop
  const [profileOpen, setProfileOpen] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setProfileOpen(window.innerWidth >= 768)
    }
  }, [])
  useEffect(() => {
    if (!customerId) return
    if (typeof window !== 'undefined') {
      setProfileOpen(window.innerWidth >= 768)
    }
  }, [customerId])

  // Flatten pages (newest-first per page) then reverse for chronological display
  const messages = data?.pages.flatMap((p) => p.results).reverse() ?? []

  // Auto-scroll to bottom on initial load
  const initialScrollDone = useRef(false)
  useEffect(() => {
    if (!isLoading && messages.length > 0 && !initialScrollDone.current) {
      initialScrollDone.current = true
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
    }
  }, [isLoading, messages.length])

  // Reset on customer switch
  useEffect(() => {
    initialScrollDone.current = false
  }, [customerId])

  // Auto-scroll to bottom when a new message arrives (only if near bottom)
  const prevMsgCount = useRef(0)
  useEffect(() => {
    const count = messages.length
    if (count > prevMsgCount.current && initialScrollDone.current) {
      const el = scrollRef.current
      if (el) {
        const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
        if (distFromBottom < 120) {
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
    prevMsgCount.current = count
  }, [messages.length])

  // Scroll to bottom when typing indicator appears
  useEffect(() => {
    if (customerTyping && initialScrollDone.current) {
      const el = scrollRef.current
      if (el) {
        const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
        if (distFromBottom < 120) {
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
  }, [customerTyping])

  // IntersectionObserver: auto-fetch when top sentinel is visible
  const loadOlder = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) return
    const el = scrollRef.current
    const prevScrollHeight = el?.scrollHeight ?? 0
    await fetchNextPage()
    // Restore scroll position so content doesn't jump
    requestAnimationFrame(() => {
      if (el) el.scrollTop = el.scrollHeight - prevScrollHeight
    })
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  useEffect(() => {
    const sentinel = topSentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadOlder()
      },
      { root: scrollRef.current, threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadOlder])

  if (!customerId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-chat gap-3">
        <svg className="w-10 h-10 text-text-muted opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
        </svg>
        <p className="text-text-muted text-sm">Select a conversation to start</p>
        <button
          onClick={onBack}
          className="md:hidden mt-1 text-xs text-brand border border-brand/30 rounded-full px-4 py-1.5 hover:bg-brand/5 transition-colors"
        >
          View conversations
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Chat area */}
      <div className="flex flex-col flex-1 bg-surface-chat overflow-hidden min-w-0">

        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-default bg-surface-chat shrink-0">
          <button
            onClick={onBack}
            className="md:hidden shrink-0 w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:text-text-primary hover:bg-surface-sidebar-item transition-colors"
            title="Back to conversations"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-brand/20 text-brand text-xs">
              {initials(customer?.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {customer?.name || 'Unknown'}
            </p>
            <div className="flex items-center gap-1.5">
              {customer?.last_channel_type && (
                <ChannelBadge type={customer.last_channel_type} size="xs" />
              )}
              {customer?.channel_identities?.length > 1 && (
                <span className="text-[10px] text-text-muted">
                  +{customer.channel_identities.length - 1} more
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setProfileOpen((v) => !v)}
            className={cn(
              'shrink-0 w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] transition-colors',
              profileOpen
                ? 'bg-brand/10 text-brand'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-sidebar-item'
            )}
            title="Customer profile"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
          {/* Top sentinel — triggers load of older messages when scrolled into view */}
          <div ref={topSentinelRef} className="h-1" />

          {/* Loading older indicator */}
          {isFetchingNextPage && (
            <p className="text-center text-xs text-text-muted py-2">Loading older messages…</p>
          )}

          {isLoading && (
            <p className="text-center text-xs text-text-muted py-8">Loading messages…</p>
          )}

          {messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              prevMessage={messages[i - 1]}
            />
          ))}

          {customerTyping && (
            <div className="flex items-end gap-2 self-start">
              <div className="bg-surface-sidebar rounded-[4px_16px_16px_16px] px-3 py-2.5 flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <MessageInput
          customerId={customerId}
          lastChannelType={customer?.last_channel_type}
          lastChannelId={customer?.last_channel_id}
          onSend={sendMessage}
          onType={sendTyping}
        />
      </div>

      {/* Mobile backdrop for profile */}
      {profileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setProfileOpen(false)}
        />
      )}

      {/* Right: Customer profile panel */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-40 transition-transform duration-200',
          'md:static md:inset-auto md:z-auto md:transition-none',
          profileOpen
            ? 'translate-x-0'
            : 'translate-x-full md:translate-x-0 md:hidden'
        )}
      >
        <CustomerProfile
          customerId={customerId}
          onClose={() => setProfileOpen(false)}
        />
      </div>
    </div>
  )
}
