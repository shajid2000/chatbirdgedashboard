import { useCustomer, useUpdateStatus, useAssignAgent } from '@/hooks/useCustomers'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import ChannelBadge from '@/components/shared/ChannelBadge'
import { toast } from 'sonner'

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

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

  return (
    <div
      className="w-72 md:w-64 flex flex-col bg-surface-panel border-l border-border-default overflow-y-auto h-full"
      style={{ boxShadow: 'var(--shadow-panel)' }}
    >
      {/* Header with close button */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide">Profile</p>
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

      {/* Avatar + name */}
      <div className="flex flex-col items-center px-4 pt-2 pb-4 text-center">
        <Avatar className="h-14 w-14 mb-3">
          <AvatarFallback className="bg-brand/20 text-brand text-lg font-semibold">
            {initials(customer.name)}
          </AvatarFallback>
        </Avatar>
        <p className="font-semibold text-text-primary text-sm">{customer.name || 'Unknown'}</p>
        {customer.phone && <p className="text-xs text-text-muted mt-0.5">{customer.phone}</p>}
        {customer.email && <p className="text-xs text-text-muted">{customer.email}</p>}
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
    </div>
  )
}
