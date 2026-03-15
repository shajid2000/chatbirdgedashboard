import ChannelBadge from '@/components/shared/ChannelBadge'

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function isSameGroup(msg, prev) {
  if (!prev) return false
  return (
    msg.speaker === prev.speaker &&
    Math.abs(new Date(msg.timestamp) - new Date(prev.timestamp)) < 60_000 * 3
  )
}

export default function MessageBubble({ message, prevMessage }) {
  const isOut = message.speaker === 'agent' || message.speaker === 'bot'
  const grouped = isSameGroup(message, prevMessage)

  return (
    <div className={`flex flex-col ${isOut ? 'items-end' : 'items-start'} ${grouped ? 'mt-0.5' : 'mt-3'}`}>

      {/* Speaker label — only show on first of group */}
      {!grouped && (
        <div className={`flex items-center gap-1.5 mb-1 ${isOut ? 'flex-row-reverse' : ''}`}>
          <span className="text-[11px] font-medium text-text-secondary">
            {isOut
              ? message.speaker_agent?.full_name || (message.speaker === 'bot' ? 'Bot' : 'Agent')
              : 'Customer'}
          </span>
          {message.channel_type && (
            <ChannelBadge type={message.channel_type} size="xs" />
          )}
        </div>
      )}

      {/* Bubble */}
      <div
        className="max-w-[72%] px-3.5 py-2 text-sm leading-relaxed"
        style={{
          backgroundColor: isOut
            ? 'hsl(var(--bubble-out-bg))'
            : 'hsl(var(--bubble-in-bg))',
          color: isOut
            ? 'hsl(var(--bubble-out-text))'
            : 'hsl(var(--bubble-in-text))',
          borderRadius: isOut
            ? 'var(--radius-bubble) var(--radius-bubble-tail) var(--radius-bubble) var(--radius-bubble)'
            : 'var(--radius-bubble-tail) var(--radius-bubble) var(--radius-bubble) var(--radius-bubble)',
        }}
      >
        {message.content}
      </div>

      {/* Timestamp */}
      <span className="text-[10px] text-text-muted mt-0.5 px-1">
        {formatTime(message.timestamp)}
      </span>
    </div>
  )
}
