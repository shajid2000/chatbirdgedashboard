import { useEffect, useRef, useState } from 'react'
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
  const bottomRef = useRef(null)
  const { data: customer } = useCustomer(customerId)
  const { data: messages = [], isLoading } = useMessages(customerId)
  const { sendMessage } = useChatSocket(customerId)

  // Profile panel: closed by default on mobile, open on desktop
  const [profileOpen, setProfileOpen] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setProfileOpen(window.innerWidth >= 768)
    }
  }, [])
  // Reset when switching customers: open on desktop, close on mobile
  useEffect(() => {
    if (!customerId) return
    if (typeof window !== 'undefined') {
      setProfileOpen(window.innerWidth >= 768)
    }
  }, [customerId])

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!customerId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-chat gap-3">
        <svg className="w-10 h-10 text-text-muted opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
        </svg>
        <p className="text-text-muted text-sm">Select a conversation to start</p>
        {/* Mobile only: button to open the sidebar */}
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
          {/* Back button — mobile only */}
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

          {/* Info / profile toggle */}
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
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
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
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <MessageInput
          customerId={customerId}
          lastChannelType={customer?.last_channel_type}
          lastChannelId={customer?.last_channel_id}
          onSend={sendMessage}
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
          // Mobile: fixed right drawer
          'fixed inset-y-0 right-0 z-40 transition-transform duration-200',
          // Desktop: normal layout flow
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
