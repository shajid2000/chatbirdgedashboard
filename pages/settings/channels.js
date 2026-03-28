import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import SettingsLayout from '@/components/settings/SettingsLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import ChannelBadge from '@/components/shared/ChannelBadge'
import Can from '@/components/shared/Can'
import {
  useSourceConnections,
  useConnectSource,
  useAssignSource,
  useDisconnectSource,
} from '@/hooks/useSourceConnections'
import api from '@/lib/api'

function useChannelTypes() {
  return useQuery({
    queryKey: ['channel-types'],
    queryFn: async () => {
      const { data } = await api.get('/channel-types/')
      return data
    },
  })
}

function useAllChannels() {
  return useQuery({
    queryKey: ['channels-all'],
    queryFn: async () => {
      const { data } = await api.get('/channels/')
      return data
    },
  })
}

// ─── Page picker modal ────────────────────────────────────────────────────────

function PagePickerModal({ pages, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-6 py-5 border-b border-border-default">
          <h2 className="text-base font-semibold text-text-primary">Choose a Facebook Page</h2>
          <p className="text-xs text-text-muted mt-1">Select the page to connect to your inbox.</p>
        </div>
        <div className="divide-y divide-border-default max-h-72 overflow-y-auto">
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => onSelect(page)}
              className="w-full flex items-center gap-3 px-6 py-4 hover:bg-surface-app text-left transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                {page.name?.[0]?.toUpperCase() ?? 'P'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{page.name}</p>
                <p className="text-xs text-text-muted">ID: {page.id}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-border-default flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Source connection card ───────────────────────────────────────────────────

const SOURCE_META = {
  'facebook.com': {
    label: 'Facebook Messenger',
    color: '#0099FF',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0099FF">
        <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.1l3.131 3.26L19.752 8.1l-6.561 6.863z" />
      </svg>
    ),
  },
  whatsapp: {
    label: 'WhatsApp Business',
    color: '#25D366',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#25D366">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
    ),
  },
}

function SourceConnectionCard({ connection }) {
  const disconnect = useDisconnectSource()
  const meta = SOURCE_META[connection.source] ?? { label: connection.source, icon: null, color: '#888' }

  const statusColor =
    connection.business_verification_status === 'verified'
      ? 'text-green-600 bg-green-50'
      : 'text-yellow-600 bg-yellow-50'

  const handleDisconnect = async () => {
    if (!confirm(`Disconnect ${meta.label}? This will stop receiving messages from this account.`)) return
    try {
      await disconnect.mutateAsync(connection.id)
      toast.success(`${meta.label} disconnected.`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to disconnect.')
    }
  }

  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-app border border-border-default shrink-0">
          {meta.icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">{meta.label}</p>
          {connection.page_name && <p className="text-xs text-text-muted truncate">Page: {connection.page_name}</p>}
          {connection.waba_name && <p className="text-xs text-text-muted truncate">WABA: {connection.waba_name}</p>}
          {connection.business_manager_name && <p className="text-xs text-text-muted truncate">Business: {connection.business_manager_name}</p>}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-50 text-green-600">Connected</span>
            {connection.business_verification_status && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusColor}`}>
                {connection.business_verification_status === 'verified' ? '✓ Verified' : connection.business_verification_status}
              </span>
            )}
            {connection.business_approved_status && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                {connection.business_approved_status}
              </span>
            )}
          </div>
        </div>
      </div>
      <Can permission="channels.modify">
        <Button
          variant="ghost" size="sm"
          className="text-destructive hover:text-destructive text-xs shrink-0"
          onClick={handleDisconnect}
          disabled={disconnect.isPending}
        >
          {disconnect.isPending ? 'Removing…' : 'Disconnect'}
        </Button>
      </Can>
    </div>
  )
}

// ─── OAuth connect button ─────────────────────────────────────────────────────

function OAuthConnectButton({ source, label, icon, disabled }) {
  const connectSource = useConnectSource()
  const assignSource = useAssignSource()
  const [loading, setLoading] = useState(false)
  const [pages, setPages] = useState(null)
  const popupRef = useRef(null)

  useEffect(() => {
    const handler = async (event) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== 'meta_oauth_callback') return
      if (event.data?.source !== source) return
      const fullUrl = event.data.url
      if (!fullUrl) return
      setLoading(true)
      try {
        const result = await connectSource.mutateAsync({ source, auth_code: fullUrl })
        if (result.facebook_pages?.length > 1) {
          setPages(result.facebook_pages)
        } else {
          toast.success(`${label} connected successfully!`)
        }
      } catch (err) {
        toast.error(err.response?.data?.detail || `Failed to connect ${label}.`)
      } finally {
        setLoading(false)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [source, label]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = async () => {
    setLoading(true)
    try {
      const { login_url } = await connectSource.mutateAsync({ source })
      const width = 600, height = 700
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2
      localStorage.setItem('oauth_pending_source', source)
      popupRef.current = window.open(login_url, 'meta-oauth', `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`)
    } catch (err) {
      toast.error(err.response?.data?.detail || `Failed to start ${label} connection.`)
      setLoading(false)
    }
    const t = setTimeout(() => setLoading(false), 120_000)
    return () => clearTimeout(t)
  }

  const handlePageSelect = async (page) => {
    setPages(null)
    setLoading(true)
    try {
      await assignSource.mutateAsync({
        source,
        properties: [{ item: { page_id: page.id, page_name: page.name, page_token: page.access_token } }],
      })
      toast.success(`${label} connected via "${page.name}".`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to assign page.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleConnect}
        disabled={disabled || loading}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-border-default bg-white hover:bg-surface-app hover:border-brand/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
      >
        <div className="w-9 h-9 rounded-lg bg-surface-app border border-border-default flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">{label}</p>
          <p className="text-xs text-text-muted">Connect via Meta OAuth</p>
        </div>
        {loading ? (
          <svg className="w-4 h-4 text-text-muted animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        )}
      </button>
      {pages && <PagePickerModal pages={pages} onSelect={handlePageSelect} onClose={() => setPages(null)} />}
    </>
  )
}

// ─── Manual channel form ──────────────────────────────────────────────────────

function ConnectChannelForm({ channelType, onSuccess, onCancel }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ name: '', access_token: '', webhook_secret: '', phone_number_id: '', page_id: '' })
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const connect = useMutation({
    mutationFn: (payload) => api.post('/channels/', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels-all'] })
      queryClient.invalidateQueries({ queryKey: ['channels'] })
      toast.success(`${channelType.label} connected.`)
      onSuccess()
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to connect.'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { name: form.name, channel_type_id: channelType.id, access_token: form.access_token, webhook_secret: form.webhook_secret }
    if (form.phone_number_id) payload.phone_number_id = form.phone_number_id
    if (form.page_id) payload.page_id = form.page_id
    connect.mutate(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-4">
      <div className="space-y-1"><Label>Channel name</Label><Input placeholder={`e.g. Support ${channelType.label}`} value={form.name} onChange={set('name')} required /></div>
      <div className="space-y-1"><Label>Access token</Label><Input type="password" placeholder="EAAxxxxxx" value={form.access_token} onChange={set('access_token')} required /></div>
      <div className="space-y-1">
        <Label>Webhook verify token</Label>
        <Input placeholder="my_secret_token" value={form.webhook_secret} onChange={set('webhook_secret')} required />
        <p className="text-[11px] text-text-muted">Use this as the Verify Token in Meta Developer Console.</p>
      </div>
      {channelType.key === 'instagram' && (
        <div className="space-y-1"><Label>Page ID</Label><Input placeholder="987654321" value={form.page_id} onChange={set('page_id')} required /></div>
      )}
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" className="bg-brand hover:bg-brand-hover text-text-on-brand" disabled={connect.isPending}>
          {connect.isPending ? 'Connecting…' : 'Connect'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

function ChannelRow({ channel }) {
  const queryClient = useQueryClient()
  const disconnect = useMutation({
    mutationFn: () => api.delete(`/channels/${channel.id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels-all'] })
      queryClient.invalidateQueries({ queryKey: ['channels'] })
      toast.success('Channel disconnected.')
    },
    onError: () => toast.error('Failed to disconnect.'),
  })

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <ChannelBadge type={channel.channel_type.key} />
        <div>
          <p className="text-sm font-medium text-text-primary">{channel.name}</p>
          <p className="text-xs text-text-muted">{channel.phone_number_id || channel.page_id || '—'}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            color: channel.status === 'active' ? 'hsl(var(--status-open))' : 'hsl(var(--status-resolved))',
            backgroundColor: channel.status === 'active' ? 'hsl(var(--status-open) / 0.1)' : 'hsl(var(--status-resolved) / 0.1)',
          }}
        >
          {channel.status}
        </span>
        <Can permission="channels.modify">
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive text-xs" onClick={() => disconnect.mutate()} disabled={disconnect.isPending}>
            Disconnect
          </Button>
        </Can>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChannelsSettingsPage() {
  const [connectingType, setConnectingType] = useState(null)
  const { data: channelTypes = [] } = useChannelTypes()
  const { data: channels = [] } = useAllChannels()
  const { data: sourceConnections = [], isLoading: loadingConns } = useSourceConnections()

  const connectedSources = new Set(sourceConnections.map((c) => c.source))
  const manualChannelTypes = channelTypes.filter((ct) => !['whatsapp', 'messenger'].includes(ct.key))
  const manualChannels = channels.filter((ch) => !['whatsapp', 'messenger'].includes(ch.channel_type?.key))

  return (
    <SettingsLayout>
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Channels</h2>
        <p className="text-sm text-text-muted mt-0.5">Manage connected messaging platforms.</p>
      </div>

      {/* Meta Business Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meta Business Accounts</CardTitle>
          <CardDescription>Connect WhatsApp Business or Facebook Messenger via Meta's secure OAuth flow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingConns ? (
            <p className="text-sm text-text-muted">Loading connections…</p>
          ) : sourceConnections.length > 0 ? (
            <div className="divide-y divide-border-default">
              {sourceConnections.map((conn) => <SourceConnectionCard key={conn.id} connection={conn} />)}
            </div>
          ) : null}

          <Can permission="channels.modify">
            {!connectedSources.has('whatsapp') && (
              <OAuthConnectButton
                source="whatsapp"
                label="WhatsApp Business"
                icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>}
              />
            )}
            {!connectedSources.has('facebook.com') && (
              <OAuthConnectButton
                source="facebook.com"
                label="Facebook Messenger"
                icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0099FF"><path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.1l3.131 3.26L19.752 8.1l-6.561 6.863z" /></svg>}
              />
            )}
            {connectedSources.has('whatsapp') && connectedSources.has('facebook.com') && (
              <p className="text-xs text-text-muted text-center py-1">All Meta accounts connected.</p>
            )}
          </Can>
        </CardContent>
      </Card>

      {/* Other Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Other Channels</CardTitle>
          <CardDescription>Connect Instagram, Web Chat, or Email manually.</CardDescription>
        </CardHeader>
        <CardContent>
          {manualChannels.length > 0 && (
            <>
              <div className="divide-y divide-border-default mb-4">
                {manualChannels.map((ch) => <ChannelRow key={ch.id} channel={ch} />)}
              </div>
              <Separator className="mb-4" />
            </>
          )}
          <Can permission="channels.modify">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {manualChannelTypes.map((ct) => (
                <button
                  key={ct.key}
                  onClick={() => setConnectingType(connectingType?.key === ct.key ? null : ct)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-[var(--radius-md)] border transition-all ${
                    connectingType?.key === ct.key ? 'border-brand bg-brand/5' : 'border-border-default hover:border-brand/40 hover:bg-surface-app'
                  }`}
                >
                  <img src={ct.icon} alt={ct.label} className="w-6 h-6" onError={(e) => { e.target.style.display = 'none' }} />
                  <span className="text-xs font-medium text-text-primary">{ct.label}</span>
                </button>
              ))}
            </div>
            {connectingType && (
              <>
                <Separator className="my-4" />
                <p className="text-sm font-medium text-text-primary mb-1">Connect {connectingType.label}</p>
                <ConnectChannelForm channelType={connectingType} onSuccess={() => setConnectingType(null)} onCancel={() => setConnectingType(null)} />
              </>
            )}
          </Can>
        </CardContent>
      </Card>

      {/* Webhook URL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Webhook URL</CardTitle>
          <CardDescription>Use this URL in Meta Developer Console for all platforms.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 bg-surface-app border border-border-default rounded-[var(--radius-sm)] px-3 py-2">
            <code className="text-xs text-text-secondary flex-1 truncate">
              {process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/webhooks/meta/
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/webhooks/meta/`)
                toast.success('Copied!')
              }}
              className="text-xs text-brand hover:text-brand-hover shrink-0"
            >
              Copy
            </button>
          </div>
          <p className="text-[11px] text-text-muted mt-2">
            OAuth callback URL:{' '}
            <code className="bg-surface-app px-1 rounded">
              {typeof window !== 'undefined' ? window.location.origin : ''}/settings/callback
            </code>
          </p>
        </CardContent>
      </Card>
    </SettingsLayout>
  )
}
