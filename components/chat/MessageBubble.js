import ChannelBadge from '@/components/shared/ChannelBadge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function ReadTick({ isRead }) {
  const color = isRead ? 'var(--color-primary, #6366f1)' : '#9ca3af'
  const label = isRead ? 'Read' : 'Sent'
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center flex-shrink-0" aria-label={label}>
          {/* First tick */}
          <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 4L3.5 6.5L9 1" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {/* Second tick — only shown when read */}
          {isRead && (
            <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '-5px' }}>
              <path d="M1 4L3.5 6.5L9 1" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">{label}</p>
      </TooltipContent>
    </Tooltip>
  )
}

function isSameGroup(msg, prev) {
  if (!prev) return false
  return (
    msg.speaker === prev.speaker &&
    Math.abs(new Date(msg.timestamp) - new Date(prev.timestamp)) < 60_000 * 3
  )
}

function ErrorIcon({ error }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white flex-shrink-0"
          aria-label="Send error"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-2.5 h-2.5">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 6.5a.875.875 0 1 1 0-1.75A.875.875 0 0 1 8 11z" />
          </svg>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px]">
        <p className="font-semibold text-red-400 mb-0.5">Failed to deliver</p>
        <p className="text-xs opacity-90 leading-snug">{error}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export default function MessageBubble({ message, prevMessage }) {
  const isOut = message.speaker === 'agent' || message.speaker === 'bot'
  const grouped = isSameGroup(message, prevMessage)
  const hasError = !!message.send_error

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

      {/* Bubble + error icon row */}
      <div className={`flex items-end gap-1.5 ${isOut ? 'flex-row-reverse' : ''}`}>
        <div
          className="max-w-[72wh] px-3.5 py-2 text-sm leading-relaxed break-words"
          style={{
            backgroundColor: hasError
              ? 'hsl(0 60% 96%)'
              : isOut
              ? 'hsl(var(--bubble-out-bg))'
              : 'hsl(var(--bubble-in-bg))',
            color: hasError
              ? 'hsl(0 50% 35%)'
              : isOut
              ? 'hsl(var(--bubble-out-text))'
              : 'hsl(var(--bubble-in-text))',
            borderRadius: isOut
              ? '1rem 0.375rem 1rem 1rem'
              : '0.375rem 1rem 1rem 1rem',
            border: hasError ? '1px solid hsl(0 60% 85%)' : undefined,
          }}
        >
          {message.content}
        </div>

        {hasError && <ErrorIcon error={message.send_error} />}
      </div>

      {/* Timestamp + read tick */}
      <div className={`flex items-center gap-1 mt-0.5 px-1 ${isOut ? 'flex-row-reverse' : ''}`}>
        <span className="text-[10px] text-text-muted">
          {formatTime(message.timestamp)}
          {hasError && <span className="text-red-400 ml-1">· not delivered</span>}
        </span>
        {isOut && !hasError && <ReadTick isRead={message.is_read} />}
      </div>
    </div>
  )
}
