import { useEffect, useRef } from 'react'
import { useMessages } from '@/hooks/useMessages'
import { useChatSocket } from '@/hooks/useWebSocket'
import { useCustomer } from '@/hooks/useCustomers'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import CustomerProfile from '@/components/customer/CustomerProfile'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import ChannelBadge from '@/components/shared/ChannelBadge'

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function ChatWindow({ customerId }) {
  const bottomRef = useRef(null)
  const { data: customer } = useCustomer(customerId)
  const { data: messages = [], isLoading } = useMessages(customerId)
  const { sendMessage } = useChatSocket(customerId)

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!customerId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-chat">
        <p className="text-text-muted text-sm">Select a conversation to start</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Chat area */}
      <div className="flex flex-col flex-1 bg-surface-chat overflow-hidden">

        {/* Chat header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border-default bg-surface-chat">
          <Avatar className="h-8 w-8">
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
                  +{customer.channel_identities.length - 1} more channels
                </span>
              )}
            </div>
          </div>
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

      {/* Right: Customer profile panel */}
      <CustomerProfile customerId={customerId} />
    </div>
  )
}
