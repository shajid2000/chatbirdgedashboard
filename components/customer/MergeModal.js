import { useState, useEffect, useRef } from 'react'
import { useMergeCustomer } from '@/hooks/useCustomers'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import ChannelBadge from '@/components/shared/ChannelBadge'
import { customerDisplayName, customerInitials } from '@/lib/utils'
import { toast } from 'sonner'
import api from '@/lib/api'

export default function MergeModal({ customer, onClose, onMerged }) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState([]) // array of customer objects
  const [confirming, setConfirming] = useState(false)
  const inputRef = useRef(null)
  const merge = useMergeCustomer(customer.id)

  // Auto-focus search on open
  useEffect(() => { inputRef.current?.focus() }, [])

  async function runSearch() {
    if (!search.trim()) { setResults([]); return }
    setSearching(true)
    try {
      const { data } = await api.get('/customers/', { params: { search: search.trim(), page_size: 8 } })
      const selectedIds = new Set(selected.map((s) => s.id))
      setResults(
        (data.results || []).filter((c) => c.id !== customer.id && !selectedIds.has(c.id))
      )
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  function handleSearchKey(e) {
    if (e.key === 'Enter') runSearch()
  }

  function toggleSelect(c) {
    setSelected((prev) =>
      prev.find((s) => s.id === c.id) ? prev.filter((s) => s.id !== c.id) : [...prev, c]
    )
  }

  async function confirmMerge() {
    try {
      const { data } = await merge.mutateAsync(selected.map((s) => s.id))
      toast.success(`Merged ${selected.length} customer${selected.length > 1 ? 's' : ''} into ${customerDisplayName(data)}`)
      onMerged?.(data)
      onClose()
    } catch {
      toast.error('Merge failed. Please try again.')
    }
  }

  const allChannels = (cs) =>
    cs.channel_identities?.map((ci) => ci.channel_type).filter((v, i, a) => a.indexOf(v) === i) ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md bg-surface-panel rounded-[var(--radius-md)] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
          <div>
            <p className="text-sm font-semibold text-text-primary">Merge Customer</p>
            <p className="text-xs text-text-muted mt-0.5">
              Merging into: <span className="text-text-primary font-medium">{customerDisplayName(customer)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:text-text-primary hover:bg-surface-sidebar-item transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!confirming ? (
          <>
            {/* Search */}
            <div className="px-5 pt-4 pb-2">
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchKey}
                  placeholder="Search by name, phone or email…"
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-[var(--radius-sm)] bg-surface-app border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand/50"
                />
              </div>
            </div>

            {/* Selected chips */}
            {selected.length > 0 && (
              <div className="px-5 pb-2 flex flex-wrap gap-1.5">
                {selected.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 text-xs bg-brand/10 text-brand border border-brand/20 rounded-full px-2.5 py-0.5"
                  >
                    {customerDisplayName(s)}
                    <button onClick={() => toggleSelect(s)} className="hover:opacity-70">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search results */}
            <div className="flex-1 overflow-y-auto min-h-[160px] max-h-64 px-3 pb-3">
              {searching && (
                <p className="text-xs text-text-muted text-center py-6">Searching…</p>
              )}
              {!searching && search && results.length === 0 && (
                <p className="text-xs text-text-muted text-center py-6">No customers found</p>
              )}
              {!searching && !search && (
                <p className="text-xs text-text-muted text-center py-6">Type to search for the duplicate customer</p>
              )}
              {results.map((c) => {
                const isSelected = selected.find((s) => s.id === c.id)
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleSelect(c)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] transition-colors ${
                      isSelected ? 'bg-brand/10 border border-brand/20' : 'hover:bg-surface-sidebar-item'
                    }`}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-brand/20 text-brand text-xs font-medium">
                        {customerInitials(c)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{customerDisplayName(c)}</p>
                      <div className="flex gap-1 mt-0.5">
                        {allChannels(c).map((ch) => (
                          <ChannelBadge key={ch} type={ch} size="xs" />
                        ))}
                      </div>
                    </div>
                    {isSelected && (
                      <svg className="w-4 h-4 text-brand shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border-default flex justify-end gap-2">
              <button
                onClick={onClose}
                className="text-sm px-4 py-1.5 rounded-[var(--radius-sm)] border border-border-default text-text-muted hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={selected.length === 0}
                onClick={() => setConfirming(true)}
                className="text-sm px-4 py-1.5 rounded-[var(--radius-sm)] bg-brand text-text-on-brand font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Review merge ({selected.length})
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Confirm screen */}
            <div className="px-5 py-4 flex-1 overflow-y-auto">
              <p className="text-xs text-text-muted mb-4">
                The following customers will be merged into <span className="text-text-primary font-medium">{customerDisplayName(customer)}</span>. This cannot be undone.
              </p>

              {/* Primary */}
              <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">Keep (primary)</p>
              <CustomerMergeCard customer={customer} allChannels={allChannels} />

              {/* Merge arrow */}
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-border-default" />
                <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <div className="flex-1 h-px bg-border-default" />
              </div>

              {/* Secondaries */}
              <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">Absorb & delete</p>
              <div className="space-y-2">
                {selected.map((s) => (
                  <CustomerMergeCard key={s.id} customer={s} allChannels={allChannels} />
                ))}
              </div>

              <p className="text-xs text-text-muted mt-4 p-3 bg-surface-app rounded-[var(--radius-sm)] border border-border-default">
                All messages and channel identities from the absorbed customers will move to the primary. Missing name/phone/email will be filled from the absorbed records.
              </p>
            </div>

            <div className="px-5 py-4 border-t border-border-default flex justify-end gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="text-sm px-4 py-1.5 rounded-[var(--radius-sm)] border border-border-default text-text-muted hover:text-text-primary transition-colors"
              >
                Back
              </button>
              <button
                onClick={confirmMerge}
                disabled={merge.isPending}
                className="text-sm px-4 py-1.5 rounded-[var(--radius-sm)] bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {merge.isPending ? 'Merging…' : 'Confirm merge'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function CustomerMergeCard({ customer, allChannels }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-[var(--radius-sm)] bg-surface-app border border-border-default">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-brand/20 text-brand text-xs font-medium">
          {customerInitials(customer)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{customerDisplayName(customer)}</p>
        <div className="flex gap-1 mt-0.5">
          {allChannels(customer).map((ch) => (
            <ChannelBadge key={ch} type={ch} size="xs" />
          ))}
        </div>
      </div>
    </div>
  )
}
