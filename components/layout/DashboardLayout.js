import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import InboxSidebar from '@/components/inbox/InboxSidebar'
import { useInboxSocket } from '@/hooks/useWebSocket'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Inbox', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
    </svg>
  )},
  { href: '/team', label: 'Team', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0zm6 4a2 2 0 100-4 2 2 0 000 4zM3 16a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
  )},
  { href: '/settings', label: 'Settings', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )},
]

export default function DashboardLayout({ children, selectedCustomerId, onSelectCustomer, sidebarOpen, onToggleSidebar }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  // Unread counts and last messages kept outside the React Query cache so server
  // refetches don't wipe them. Easy to extend into a notification system later.
  const [unreadCounts, setUnreadCounts] = useState({})
  const [lastMessages, setLastMessages] = useState({})

  // Ref so useInboxSocket can read the current selection without reconnecting
  const selectedCustomerIdRef = useRef(selectedCustomerId)
  useEffect(() => {
    selectedCustomerIdRef.current = selectedCustomerId
  }, [selectedCustomerId])

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading])

  useInboxSocket((data) => {
    if (data.type === 'customer_merged') {
      const { primary_id, merged_ids } = data
      // Remove merged secondaries from local state
      setUnreadCounts((prev) => {
        const next = { ...prev }
        merged_ids.forEach((id) => delete next[id])
        return next
      })
      setLastMessages((prev) => {
        const next = { ...prev }
        merged_ids.forEach((id) => delete next[id])
        return next
      })
      // If the agent is viewing a secondary that got merged, redirect to primary
      if (merged_ids.includes(selectedCustomerIdRef.current)) {
        onSelectCustomer(primary_id)
      }
      return
    }

    const { customer_id, message } = data
    // Always update last message preview
    setLastMessages((prev) => ({ ...prev, [customer_id]: message }))
    // Only count inbound messages from customers when that chat isn't open
    if (message.speaker === 'customer' && selectedCustomerIdRef.current !== customer_id) {
      setUnreadCounts((prev) => ({
        ...prev,
        [customer_id]: (prev[customer_id] || 0) + 1,
      }))
    }
  })

  function handleSelectCustomer(id) {
    setUnreadCounts((prev) => ({ ...prev, [id]: 0 }))
    onSelectCustomer(id)
  }

  if (loading || !user) return null

  const isDashboard = router.pathname === '/dashboard'

  return (
    <div className="flex h-screen bg-surface-app overflow-hidden">

      {/* Far left: icon nav */}
      <div className="w-14 flex flex-col items-center py-4 gap-1 bg-surface-sidebar border-r border-border-sidebar shrink-0 z-50">
        {/* Logo / sidebar toggle on desktop */}
        <button
          onClick={onToggleSidebar}
          className="w-8 h-8 rounded-[var(--radius-md)] bg-brand flex items-center justify-center mb-3 hover:opacity-90 transition-opacity"
          title="Toggle sidebar"
        >
          <span className="text-text-on-brand font-bold text-sm">U</span>
        </button>

        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={cn(
              'w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] transition-colors',
              router.pathname === item.href
                ? 'bg-brand text-text-on-brand'
                : 'text-text-sidebar-muted hover:text-text-sidebar hover:bg-surface-sidebar-item'
            )}
          >
            {item.icon}
          </Link>
        ))}

        {/* Spacer + logout at bottom */}
        <div className="flex-1" />
        <button
          onClick={async () => {
            setLoggingOut(true)
            await logout()
            setLoggingOut(false)
          }}
          disabled={loggingOut}
          title="Sign out"
          className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] text-text-sidebar-muted hover:text-text-sidebar hover:bg-surface-sidebar-item transition-colors disabled:opacity-50"
        >
          {loggingOut ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile backdrop for sidebar */}
      {isDashboard && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onToggleSidebar}
        />
      )}

      {/* Inbox sidebar — only on dashboard */}
      {isDashboard && (
        <div
          className={cn(
            // Mobile: fixed drawer that slides in from the left (after icon nav)
            'fixed inset-y-0 left-14 z-40 transition-transform duration-200',
            // Desktop: back to normal layout flow
            'md:static md:inset-auto md:z-auto md:transition-none',
            sidebarOpen
              ? 'translate-x-0'
              : '-translate-x-full md:-translate-x-px md:hidden'
          )}
        >
          <InboxSidebar
            user={user}
            selectedCustomerId={selectedCustomerId}
            onSelectCustomer={handleSelectCustomer}
            unreadCounts={unreadCounts}
            lastMessages={lastMessages}
            onClose={onToggleSidebar}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden min-w-0">
        {children}
      </div>
    </div>
  )
}
