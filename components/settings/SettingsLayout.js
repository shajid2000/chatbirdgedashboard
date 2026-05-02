import Link from 'next/link'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/layout/DashboardLayout'

const NAV = [
  {
    href: '/settings/channels',
    label: 'Channels',
    description: 'Connected platforms & webhooks',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    href: '/settings/ai',
    label: 'AI Agent',
    description: 'Auto-reply configuration',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.357 2.059l.096.04A2.25 2.25 0 0117.25 13.5h.008m-9.5 1v-.004c0-.378.18-.736.487-.957L12 11.25l3.755 2.289c.307.22.487.579.487.957V14.5m-9.5 0a2.25 2.25 0 000 4.5h9.5a2.25 2.25 0 000-4.5m-9.5 0H5.625" />
      </svg>
    ),
  },
  {
    href: '/settings/knowledge',
    label: 'Knowledge Base',
    description: 'Documents, FAQs, policies',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
]

export default function SettingsLayout({ children }) {
  const { pathname } = useRouter()

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row flex-1 h-full overflow-hidden">

        {/* ── Mobile: horizontal tab nav ── */}
        <div className="md:hidden shrink-0 border-b border-border-default bg-surface-app">
          <div className="px-4 pt-3 pb-0">
            <h1 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Settings</h1>
          </div>
          <nav className="flex overflow-x-auto px-3 pt-1 gap-0.5">
            {NAV.map(({ href, label, icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                    active
                      ? 'border-brand text-brand'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <span className="shrink-0">{icon}</span>
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* ── Desktop: sidebar ── */}
        <aside className="hidden md:flex w-56 shrink-0 border-r border-border-default bg-surface-app flex-col">
          <div className="px-5 py-5 border-b border-border-default">
            <h1 className="text-sm font-semibold text-text-primary">Settings</h1>
            <p className="text-xs text-text-muted mt-0.5">Manage your workspace</p>
          </div>

          <nav className="flex flex-col gap-0.5 p-2 flex-1">
            {NAV.map(({ href, label, description, icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] transition-colors group ${
                    active
                      ? 'bg-brand/10 text-brand'
                      : 'text-text-secondary hover:bg-surface-sidebar-item hover:text-text-primary'
                  }`}
                >
                  <span className={`shrink-0 ${active ? 'text-brand' : 'text-text-muted group-hover:text-text-secondary'}`}>
                    {icon}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-xs font-medium leading-tight ${active ? 'text-brand' : ''}`}>{label}</p>
                    <p className="text-[10px] text-text-muted leading-tight truncate">{description}</p>
                  </div>
                  {active && (
                    <span className="ml-auto w-1 h-4 rounded-full bg-brand shrink-0" />
                  )}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto bg-surface-app">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
            {children}
          </div>
        </main>

      </div>
    </DashboardLayout>
  )
}
