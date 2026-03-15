const CHANNEL_CONFIG = {
  whatsapp:  { label: 'WhatsApp', color: 'var(--color-channel-whatsapp)' },
  instagram: { label: 'Instagram', color: 'var(--color-channel-instagram)' },
  messenger: { label: 'Messenger', color: 'var(--color-channel-messenger)' },
  webchat:   { label: 'Web Chat', color: 'var(--color-channel-webchat)' },
  email:     { label: 'Email', color: 'var(--color-channel-email)' },
}

export default function ChannelBadge({ type, size = 'sm' }) {
  const config = CHANNEL_CONFIG[type] || { label: type, color: 'var(--color-text-muted)' }
  const isXs = size === 'xs'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${
        isXs ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
      }`}
      style={{ backgroundColor: `${config.color}22`, color: config.color }}
    >
      <span
        className={`rounded-full ${isXs ? 'w-1 h-1' : 'w-1.5 h-1.5'}`}
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  )
}
