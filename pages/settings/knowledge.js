import { useState } from 'react'
import { toast } from 'sonner'
import SettingsLayout from '@/components/settings/SettingsLayout'
import AddKnowledgeModal from '@/components/knowledge/AddKnowledgeModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useKnowledgeChunks, useDeleteKnowledgeChunk } from '@/hooks/useKnowledge'
import { usePermissions } from '@/hooks/usePermission'

// ── Helpers ──────────────────────────────────────────────────────────────────

const BADGE_PALETTES = [
  { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF' },
  { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  { bg: '#FDF4FF', text: '#86198F', border: '#F5D0FE' },
  { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  { bg: '#EEF2FF', text: '#3730A3', border: '#C7D2FE' },
]

function sourcePalette(source) {
  if (!source) return { bg: '#F9FAFB', text: '#6B7280', border: '#E5E7EB' }
  const idx = [...source].reduce((a, c) => a + c.charCodeAt(0), 0) % BADGE_PALETTES.length
  return BADGE_PALETTES[idx]
}

function relativeDate(dateStr) {
  const diff = Date.now() - new Date(dateStr)
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d}d ago`
  if (d < 30) return `${Math.floor(d / 7)}w ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ canManage, onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-text-primary mb-1">No knowledge chunks yet</p>
      <p className="text-xs text-text-muted max-w-xs">
        Add FAQs, policies, pricing, and product details so the AI agent can answer customer questions accurately.
      </p>
      {canManage && (
        <Button size="sm" onClick={onAdd}
          className="mt-5 bg-brand hover:bg-brand-hover text-text-on-brand gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Knowledge
        </Button>
      )}
    </div>
  )
}

// ── Chunk row ─────────────────────────────────────────────────────────────────

function ChunkRow({ chunk, onDelete, canManage, isDeleting }) {
  const [expanded, setExpanded] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const palette = sourcePalette(chunk.source)
  const displayTitle = chunk.title || chunk.content.slice(0, 55) + (chunk.content.length > 55 ? '…' : '')

  function handleDeleteClick(e) {
    e.stopPropagation()
    if (confirming) {
      onDelete(chunk.id)
      setConfirming(false)
    } else {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
    }
  }

  return (
    <div className="border-b border-border-default last:border-0">
      <div
        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-surface-sidebar-item transition-colors group relative"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Source badge */}
        <span
          className="shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium border"
          style={{ background: palette.bg, color: palette.text, borderColor: palette.border }}
        >
          {chunk.source || 'manual'}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-primary leading-tight">{displayTitle}</p>
          {!expanded && (
            <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2 leading-relaxed">{chunk.content}</p>
          )}
          {expanded && (
            <p className="text-[11px] text-text-secondary mt-1 leading-relaxed whitespace-pre-wrap">{chunk.content}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-text-muted">{relativeDate(chunk.created_at)}</span>
            <span className="text-[10px] text-text-muted">·</span>
            <span className="text-[10px] text-text-muted">{chunk.content.length} chars</span>
            <span className="text-[10px] text-brand/70 font-medium">
              {expanded ? '↑ collapse' : '↓ expand'}
            </span>
          </div>
        </div>

        {/* Delete */}
        {canManage && (
          <div className="shrink-0 flex items-center" onClick={(e) => e.stopPropagation()}>
            {confirming ? (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-red-600 font-medium">Delete?</span>
                <button onClick={handleDeleteClick} disabled={isDeleting}
                  className="text-[10px] px-2 py-0.5 rounded bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50">
                  Yes
                </button>
                <button onClick={(e) => { e.stopPropagation(); setConfirming(false) }}
                  className="text-[10px] px-2 py-0.5 rounded bg-surface-sidebar-item border border-border-default text-text-secondary hover:bg-border-default">
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={handleDeleteClick} disabled={isDeleting}
                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 rounded-[var(--radius-sm)] text-text-muted hover:text-red-500 hover:bg-red-50 disabled:opacity-30"
                title="Delete chunk"
              >
                {isDeleting
                  ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                }
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export default function KnowledgePage() {
  const perms = usePermissions(['knowledge.view', 'knowledge.manage'])

  const [showModal, setShowModal] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState(null)

  const { data, isLoading } = useKnowledgeChunks({ search, source: sourceFilter, page })
  const deleteChunk = useDeleteKnowledgeChunk()

  const chunks = data?.results ?? []
  const totalCount = data?.count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const totalUnfiltered = data?.total_count ?? 0
  const sources = data?.sources ?? []

  function handleSearch(e) {
    if (e.key === 'Enter') {
      setSearch(searchInput.trim())
      setPage(1)
    }
  }

  function handleSourceFilter(val) {
    setSourceFilter(val)
    setPage(1)
  }

  function handleClearFilters() {
    setSearchInput('')
    setSearch('')
    setSourceFilter('')
    setPage(1)
  }

  async function handleDelete(id) {
    setDeletingId(id)
    try {
      await deleteChunk.mutateAsync(id)
      toast.success('Chunk deleted.')
    } catch {
      toast.error('Failed to delete chunk.')
    } finally {
      setDeletingId(null)
    }
  }

  if (!perms['knowledge.view']) {
    return (
      <SettingsLayout>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Knowledge Base</h2>
          <p className="text-sm text-text-muted mt-0.5">AI knowledge management.</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-text-muted">You don&apos;t have permission to view the knowledge base.</p>
          </CardContent>
        </Card>
      </SettingsLayout>
    )
  }

  const hasFilters = search || sourceFilter

  return (
    <SettingsLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Knowledge Base</h2>
          <p className="text-sm text-text-muted mt-0.5">
            {perms['knowledge.manage']
              ? 'Add documents, FAQs, and policies the AI agent retrieves at query time.'
              : 'Business knowledge used by the AI agent to answer customer questions.'}
          </p>
        </div>
        {perms['knowledge.manage'] && (
          <Button size="sm" onClick={() => setShowModal(true)}
            className="bg-brand hover:bg-brand-hover text-text-on-brand shrink-0 gap-1.5 w-full sm:w-auto justify-center">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Knowledge
          </Button>
        )}
      </div>

      {/* Stats bar */}
      {!isLoading && totalUnfiltered > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 rounded-[var(--radius-md)] bg-surface-app border border-border-default text-xs text-text-secondary">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand shrink-0" />
            <span><strong className="text-text-primary">{totalUnfiltered}</strong> chunks</span>
          </div>
          {sources.length > 0 && (
            <>
              <span className="text-border-default hidden sm:inline">|</span>
              <span><strong className="text-text-primary">{sources.length}</strong> source{sources.length !== 1 ? 's' : ''}</span>
            </>
          )}
          <span className="sm:ml-auto text-text-muted hidden sm:block">768-dim vectors · cosine similarity</span>
        </div>
      )}

      {/* Chunks card */}
      <Card className="overflow-hidden">
        {/* Toolbar — always visible once we have data or filters active */}
        {(!isLoading && totalUnfiltered > 0) || hasFilters ? (
          <CardHeader className="px-4 py-3 border-b border-border-default">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleSearch}
                  placeholder="Search chunks… (Enter)"
                  className="pl-8 h-8 text-xs"
                />
              </div>

              {/* Source filter pills */}
              {sources.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    onClick={() => handleSourceFilter('')}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                      !sourceFilter
                        ? 'bg-brand text-white'
                        : 'bg-surface-sidebar-item text-text-secondary border border-border-default hover:bg-border-default'
                    }`}
                  >
                    All
                  </button>
                  {sources.map(s => {
                    const p = sourcePalette(s)
                    const active = sourceFilter === s
                    return (
                      <button
                        key={s} onClick={() => handleSourceFilter(active ? '' : s)}
                        className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border"
                        style={active
                          ? { background: p.text, color: '#fff', borderColor: p.text }
                          : { background: p.bg, color: p.text, borderColor: p.border }}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Filtered result count */}
              {hasFilters && (
                <span className="text-[11px] text-text-muted ml-auto shrink-0">
                  {totalCount} result{totalCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </CardHeader>
        ) : null}

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="w-5 h-5 animate-spin text-brand" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : totalUnfiltered === 0 ? (
            <EmptyState canManage={perms['knowledge.manage']} onAdd={() => setShowModal(true)} />
          ) : chunks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <p className="text-sm font-medium text-text-primary">No chunks match your search</p>
              <p className="text-xs text-text-muted mt-1">Try a different keyword or clear the filters.</p>
              <button onClick={handleClearFilters} className="mt-3 text-xs text-brand hover:underline">
                Clear filters
              </button>
            </div>
          ) : (
            <div>
              {chunks.map(chunk => (
                <ChunkRow
                  key={chunk.id}
                  chunk={chunk}
                  canManage={perms['knowledge.manage']}
                  onDelete={handleDelete}
                  isDeleting={deletingId === chunk.id}
                />
              ))}
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border-default">
            <span className="text-xs text-text-muted">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => p - 1)} disabled={page === 1}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-xs text-text-secondary border border-border-default hover:bg-surface-sidebar-item disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Prev
              </button>
              <span className="px-3 py-1.5 text-xs text-text-secondary">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-xs text-text-secondary border border-border-default hover:bg-surface-sidebar-item disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </Card>

      {showModal && <AddKnowledgeModal onClose={() => setShowModal(false)} />}
    </SettingsLayout>
  )
}
