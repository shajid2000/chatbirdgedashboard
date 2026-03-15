import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useChannels } from '@/hooks/useChannels'
import ChannelBadge from '@/components/shared/ChannelBadge'

export default function MessageInput({ customerId, lastChannelType, lastChannelId, onSend }) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedChannelId, setSelectedChannelId] = useState(null)
  const [showChannelPicker, setShowChannelPicker] = useState(false)
  const textareaRef = useRef(null)
  const pickerRef = useRef(null)

  const { data: channels = [] } = useChannels()

  // Default to customer's last channel
  const selectedChannel = channels.find((c) => c.id === selectedChannelId)
    || channels.find((c) => c.id === lastChannelId)
    || channels[0]

  // Close picker on outside click
  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowChannelPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSend = () => {
    const text = content.trim()
    if (!text || sending) return
    setSending(true)
    try {
      // Always send the resolved channel id so the backend never falls back
      // to a null last_channel (e.g. first outbound message to a new customer)
      const channelId = selectedChannel?.id || null
      onSend(text, channelId)
      setContent('')
      setSelectedChannelId(null)
      textareaRef.current?.focus()
    } catch {
      toast.error('Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="border-t border-border-default px-4 py-3"
      style={{ backgroundColor: 'hsl(var(--surface-input))' }}
    >
      {/* Channel selector row */}
      <div className="flex items-center gap-2 mb-2 relative" ref={pickerRef}>
        <span className="text-[10px] text-text-muted">Reply via</span>

        {/* Selected channel button */}
        <button
          onClick={() => setShowChannelPicker((v) => !v)}
          className="flex items-center gap-1 rounded-[var(--radius-sm)] px-1.5 py-0.5 hover:bg-border-default/40 transition-colors"
        >
          {selectedChannel ? (
            <ChannelBadge type={selectedChannel.channel_type.key} size="xs" />
          ) : lastChannelType ? (
            <ChannelBadge type={lastChannelType} size="xs" />
          ) : (
            <span className="text-[10px] text-text-muted">No channel</span>
          )}
          <svg className="w-3 h-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {showChannelPicker && (
          <div className="absolute bottom-full left-0 mb-1 z-20 min-w-[200px] bg-surface-chat border border-border-default rounded-[var(--radius-md)] shadow-[var(--shadow-card)] py-1 overflow-hidden">
            {channels.length === 0 && (
              <p className="text-xs text-text-muted px-3 py-2">No active channels</p>
            )}
            {channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => {
                  setSelectedChannelId(ch.id)
                  setShowChannelPicker(false)
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-app transition-colors ${
                  (selectedChannelId || lastChannelId) === ch.id ? 'bg-surface-app' : ''
                }`}
              >
                <ChannelBadge type={ch.channel_type.key} size="xs" />
                <span className="text-text-primary truncate">{ch.name}</span>
                {(selectedChannelId || lastChannelId) === ch.id && (
                  <svg className="w-3.5 h-3.5 text-brand ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Show override indicator */}
        {selectedChannelId && selectedChannelId !== lastChannelId && (
          <span className="text-[10px] text-status-pending">
            ← overriding default
          </span>
        )}
      </div>

      {/* Text input + send */}
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
          rows={1}
          className="flex-1 resize-none rounded-[var(--radius-md)] border border-border-default bg-surface-app px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 min-h-[40px] max-h-32 overflow-y-auto"
          onInput={(e) => {
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
          }}
        />
        <Button
          onClick={handleSend}
          disabled={!content.trim() || sending}
          size="sm"
          className="bg-brand hover:bg-brand-hover text-text-on-brand shrink-0"
        >
          Send
        </Button>
      </div>
    </div>
  )
}
