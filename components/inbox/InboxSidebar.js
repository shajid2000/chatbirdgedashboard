import { useState } from 'react'
import { useCustomers } from '@/hooks/useCustomers'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import ChannelBadge from '@/components/shared/ChannelBadge'

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'open' },
  { label: 'Pending', value: 'pending' },
  { label: 'Resolved', value: 'resolved' },
]

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function InboxSidebar({ user, selectedCustomerId, onSelectCustomer }) {
  const [statusFilter, setStatusFilter] = useState('')
  const { data: customers = [], isLoading } = useCustomers(statusFilter ? { status: statusFilter } : {})

  return (
    <div className="w-72 flex flex-col bg-surface-sidebar border-r border-border-sidebar h-full">

      {/* Header */}
      <div className="px-4 py-4">
        <p className="text-sm font-semibold text-text-sidebar">{user?.business?.name}</p>
        <p className="text-xs text-text-sidebar-muted">{user?.full_name}</p>
      </div>

      <Separator className="bg-border-sidebar" />

      {/* Status filter tabs */}
      <div className="flex gap-1 px-3 py-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`text-xs px-2 py-1 rounded-[var(--radius-sm)] transition-colors ${
              statusFilter === f.value
                ? 'bg-brand text-text-on-brand'
                : 'text-text-sidebar-muted hover:text-text-sidebar hover:bg-surface-sidebar-item'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Customer list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <p className="text-xs text-text-sidebar-muted text-center py-8">Loading…</p>
        )}
        {!isLoading && customers.length === 0 && (
          <p className="text-xs text-text-sidebar-muted text-center py-8">No conversations yet</p>
        )}
        {customers.map((customer) => (
          <button
            key={customer.id}
            onClick={() => onSelectCustomer(customer.id)}
            className={`w-full text-left px-4 py-3 flex gap-3 items-start transition-colors ${
              selectedCustomerId === customer.id
                ? 'bg-surface-sidebar-active'
                : 'hover:bg-surface-sidebar-item'
            }`}
          >
            {/* Avatar */}
            <Avatar className="h-9 w-9 shrink-0 mt-0.5">
              <AvatarFallback className="bg-brand/20 text-brand text-xs font-medium">
                {initials(customer.name)}
              </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm font-medium text-text-sidebar truncate">
                  {customer.name || 'Unknown'}
                </span>
                <span className="text-[10px] text-text-sidebar-muted shrink-0">
                  {timeAgo(customer.last_message_at)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {customer.last_channel_type && (
                  <ChannelBadge type={customer.last_channel_type} size="xs" />
                )}
                <span className="text-xs text-text-sidebar-muted truncate">
                  {customer.status !== 'open' && (
                    <span className={`mr-1 ${customer.status === 'pending' ? 'text-status-pending' : 'text-status-resolved'}`}>
                      {customer.status}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
