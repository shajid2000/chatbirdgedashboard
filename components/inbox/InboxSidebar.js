import { useState, useEffect, useRef, useCallback } from 'react'
import { useInfiniteCustomers } from '@/hooks/useCustomers'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import ChannelBadge from '@/components/shared/ChannelBadge'
import { customerDisplayName, customerInitials } from '@/lib/utils'

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


export default function InboxSidebar({ user, selectedCustomerId, onSelectCustomer, unreadCounts = {}, lastMessages = {}, onClose }) {
  const [statusFilter, setStatusFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const sentinelRef = useRef(null)

  function commitSearch() {
    setSearch(searchInput.trim())
  }

  function handleSearchKey(e) {
    if (e.key === 'Enter') commitSearch()
    if (e.key === 'Escape') { setSearchInput(''); setSearch('') }
  }

  const filters = {}
  if (statusFilter) filters.status = statusFilter
  if (search) filters.search = search

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteCustomers(filters)

  const customers = data?.pages.flatMap((p) => p.results) ?? []

  // Infinite scroll via IntersectionObserver on sentinel div
  const onSentinel = useCallback((entries) => {
    if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(onSentinel, { threshold: 0.1 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [onSentinel])

  return (
    <div className="w-72 flex flex-col bg-surface-sidebar border-r border-border-sidebar h-full">

      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-sidebar truncate">{user?.business?.name}</p>
          <p className="text-xs text-text-sidebar-muted truncate">{user?.full_name}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 shrink-0 w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] text-text-sidebar-muted hover:text-text-sidebar hover:bg-surface-sidebar-item transition-colors"
          title="Close sidebar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <Separator className="bg-border-sidebar" />

      {/* Search */}
      <div className="px-3 pt-2">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-sidebar-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKey}
            placeholder="Search…"
            className="w-full pl-8 pr-8 py-1.5 text-xs rounded-[var(--radius-sm)] bg-surface-sidebar-item border border-border-sidebar text-text-sidebar placeholder:text-text-sidebar-muted focus:outline-none focus:ring-1 focus:ring-brand"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); setSearch('') }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-sidebar-muted hover:text-text-sidebar transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

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
          <p className="text-xs text-text-sidebar-muted text-center py-8">
            {search ? 'No results' : 'No conversations yet'}
          </p>
        )}
        {customers.map((customer) => {
          const unread = unreadCounts[customer.id] || 0
          const isSelected = selectedCustomerId === customer.id
          const lastMsg = lastMessages[customer.id]

          return (
            <button
              key={customer.id}
              onClick={() => onSelectCustomer(customer.id)}
              className={`w-full text-left px-4 py-3 flex gap-3 items-start transition-colors ${
                isSelected
                  ? 'bg-surface-sidebar-active'
                  : 'hover:bg-surface-sidebar-item'
              }`}
            >
              <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                <AvatarFallback className="bg-brand/20 text-brand text-xs font-medium">
                  {customerInitials(customer)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                {/* Row 1: name + time */}
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-sm truncate ${unread > 0 ? 'font-semibold text-text-sidebar' : 'font-medium text-text-sidebar'}`}>
                    {customerDisplayName(customer)}
                  </span>
                  <span className="text-[10px] text-text-sidebar-muted shrink-0">
                    {timeAgo(customer.last_message_at)}
                  </span>
                </div>

                {/* Row 2: channel badge + last message + unread badge */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  {customer.last_channel_type && (
                    <ChannelBadge type={customer.last_channel_type} size="xs" />
                  )}
                  {customer.status !== 'open' && (
                    <span className={`text-[10px] shrink-0 ${customer.status === 'pending' ? 'text-status-pending' : 'text-status-resolved'}`}>
                      {customer.status}
                    </span>
                  )}
                  <span className={`text-xs truncate flex-1 min-w-0 ${unread > 0 ? 'text-text-sidebar font-medium' : 'text-text-sidebar-muted'}`}>
                    {lastMsg
                      ? `${lastMsg.speaker === 'agent' ? 'You: ' : ''}${lastMsg.content}`
                      : ''}
                  </span>
                  {unread > 0 && (
                    <span className="shrink-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-brand text-text-on-brand text-[10px] font-semibold leading-none">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}

        {/* Sentinel for infinite scroll */}
        <div ref={sentinelRef} className="h-4" />
        {isFetchingNextPage && (
          <p className="text-xs text-text-sidebar-muted text-center py-2">Loading…</p>
        )}
      </div>
    </div>
  )
}
