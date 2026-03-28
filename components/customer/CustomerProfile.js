import { useState } from 'react'
import { useCustomer, useUpdateCustomer, useUpdateStatus, useAssignAgent } from '@/hooks/useCustomers'
import MergeModal from './MergeModal'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import ChannelBadge from '@/components/shared/ChannelBadge'
import { toast } from 'sonner'
import { customerDisplayName, customerInitials } from '@/lib/utils'

const STATUS_OPTIONS = ['open', 'pending', 'resolved']

const STATUS_COLORS = {
  open: 'var(--color-status-open)',
  pending: 'var(--color-status-pending)',
  resolved: 'var(--color-status-resolved)',
}

export default function CustomerProfile({ customerId, onClose }) {
  const { data: customer } = useCustomer(customerId)
  const updateStatus = useUpdateStatus(customerId)
  const assignAgent = useAssignAgent(customerId)
  const updateCustomer = useUpdateCustomer(customerId)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [merging, setMerging] = useState(false)

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data } = await api.get('/team/members/')
      return data
    },
    staleTime: 300_000,
  })

  if (!customer) return (
    <div className="w-72 md:w-64 bg-surface-panel border-l border-border-default h-full" />
  )

  function startEdit() {
    setForm({ name: customer.name || '', phone: customer.phone || '', email: customer.email || '' })
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
  }

  async function saveEdit() {
    setSaving(true)
    try {
      await updateCustomer.mutateAsync(form)
      toast.success('Customer updated')
      setEditing(false)
    } catch {
      toast.error('Failed to update customer.')
    } finally {
      setSaving(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Escape') cancelEdit()
  }

  const handleStatusChange = async (status) => {
    try {
      await updateStatus.mutateAsync(status)
      toast.success(`Marked as ${status}`)
    } catch {
      toast.error('Failed to update status.')
    }
  }

  const handleAssign = async (agentId) => {
    try {
      await assignAgent.mutateAsync(agentId || null)
      toast.success(agentId ? 'Agent assigned' : 'Agent unassigned')
    } catch {
      toast.error('Failed to assign agent.')
    }
  }

  const displayName = customerDisplayName(customer)

  return (
    <div
      className="w-72 md:w-64 flex flex-col bg-surface-panel border-l border-border-default overflow-y-auto h-full"
      style={{ boxShadow: 'var(--shadow-panel)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide">Profile</p>
        <div className="flex items-center gap-1">
          {!editing && (
            <>
              <button
                onClick={startEdit}
                className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:text-text-primary hover:bg-surface-sidebar-item transition-colors"
                title="Edit customer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z" />
                </svg>
              </button>
              <button
                onClick={() => setMerging(true)}
                className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:text-text-primary hover:bg-surface-sidebar-item transition-colors"
                title="Merge duplicate customer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:text-text-primary hover:bg-surface-sidebar-item transition-colors"
            title="Close profile"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Avatar + info */}
      <div className="flex flex-col items-center px-4 pt-2 pb-4 text-center">
        <Avatar className="h-14 w-14 mb-3">
          <AvatarFallback className="bg-brand/20 text-brand text-lg font-semibold">
            {customerInitials(customer)}
          </AvatarFallback>
        </Avatar>

        {editing ? (
          <div className="w-full space-y-2" onKeyDown={handleKey}>
            <input
              autoFocus
              type="text"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full text-sm px-2.5 py-1.5 rounded-[var(--radius-sm)] bg-surface-app border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand/50"
            />
            <input
              type="text"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full text-sm px-2.5 py-1.5 rounded-[var(--radius-sm)] bg-surface-app border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand/50"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full text-sm px-2.5 py-1.5 rounded-[var(--radius-sm)] bg-surface-app border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand/50"
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex-1 text-xs py-1.5 rounded-[var(--radius-sm)] bg-brand text-text-on-brand font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="flex-1 text-xs py-1.5 rounded-[var(--radius-sm)] border border-border-default text-text-muted hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="font-semibold text-text-primary text-sm">{displayName}</p>
            {customer.phone && <p className="text-xs text-text-muted mt-0.5">{customer.phone}</p>}
            {customer.email && <p className="text-xs text-text-muted">{customer.email}</p>}
          </>
        )}
      </div>

      <Separator className="bg-border-default" />

      {/* Status */}
      <div className="px-4 py-3">
        <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">Status</p>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className="text-xs px-2.5 py-1 rounded-full border transition-colors capitalize"
              style={{
                borderColor: customer.status === s ? STATUS_COLORS[s] : 'hsl(var(--border-default))',
                color: customer.status === s ? STATUS_COLORS[s] : 'hsl(var(--text-muted))',
                backgroundColor: customer.status === s ? `${STATUS_COLORS[s]}18` : 'transparent',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Separator className="bg-border-default" />

      {/* Assign agent */}
      <div className="px-4 py-3">
        <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">Assigned to</p>
        <select
          value={customer.assigned_agent?.id || ''}
          onChange={(e) => handleAssign(e.target.value || null)}
          className="w-full text-sm bg-surface-app border border-border-default rounded-[var(--radius-sm)] px-2 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand/30"
        >
          <option value="">Unassigned</option>
          {teamMembers.map((m) => (
            <option key={m.id} value={m.id}>{m.full_name}</option>
          ))}
        </select>
      </div>

      <Separator className="bg-border-default" />

      {/* AI auto-reply toggle */}
      <div className="px-4 py-3">
        <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">AI Auto-reply</p>
        <div className="flex gap-1.5">
          {[
            { value: null,  label: 'Default' },
            { value: true,  label: 'On' },
            { value: false, label: 'Off' },
          ].map(({ value, label }) => {
            const active = customer.ai_enabled === value
            return (
              <button
                key={String(value)}
                onClick={async () => {
                  try {
                    await updateCustomer.mutateAsync({ ai_enabled: value })
                  } catch {
                    toast.error('Failed to update AI setting.')
                  }
                }}
                className="text-xs px-2.5 py-1 rounded-full border transition-colors"
                style={{
                  borderColor: active ? 'hsl(var(--color-brand))' : 'hsl(var(--border-default))',
                  color: active ? 'hsl(var(--color-brand))' : 'hsl(var(--text-muted))',
                  backgroundColor: active ? 'hsl(var(--color-brand) / 0.08)' : 'transparent',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
        <p className="text-[10px] text-text-muted mt-1.5">
          {customer.ai_enabled === true  && 'AI will always reply to this customer.'}
          {customer.ai_enabled === false && 'AI will never reply to this customer.'}
          {customer.ai_enabled === null  && 'Follows the business AI setting.'}
        </p>
      </div>

      <Separator className="bg-border-default" />

      {/* Channel identities */}
      <div className="px-4 py-3">
        <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">Connected on</p>
        <div className="flex flex-col gap-1.5">
          {customer.channel_identities?.map((identity) => (
            <div key={identity.id} className="flex items-center gap-2">
              <ChannelBadge type={identity.channel_type} size="xs" />
              <span className="text-[10px] text-text-muted truncate">{identity.external_id}</span>
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-border-default" />

      {/* Meta */}
      <div className="px-4 py-3">
        <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">Details</p>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">First seen</span>
            <span className="text-text-secondary">{new Date(customer.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Last message</span>
            <span className="text-text-secondary">
              {customer.last_message_at ? new Date(customer.last_message_at).toLocaleDateString() : '—'}
            </span>
          </div>
        </div>
      </div>

      {merging && (
        <MergeModal
          customer={customer}
          onClose={() => setMerging(false)}
          onMerged={() => {
            setMerging(false)
            onClose?.()
          }}
        />
      )}
    </div>
  )
}
