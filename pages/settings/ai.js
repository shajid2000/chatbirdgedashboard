import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import SettingsLayout from '@/components/settings/SettingsLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAIConfig, useUpdateAIConfig } from '@/hooks/useAIConfig'
import { usePermissions } from '@/hooks/usePermission'

const PROVIDERS = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'openai', label: 'OpenAI' },
]

const DEFAULT_MODELS = {
  gemini: 'gemini-2.0-flash',
  openai: 'gpt-4o-mini',
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-brand' : 'bg-border-default'
      }`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  )
}

export default function AISettingsPage() {
  const { data: config, isLoading } = useAIConfig()
  const update = useUpdateAIConfig()
  const perms = usePermissions(['ai.view', 'ai.toggle', 'ai.configure'])

  const [form, setForm] = useState(null)
  const [showKey, setShowKey] = useState(false)
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  useEffect(() => {
    if (config && perms['ai.configure']) {
      setForm({
        provider: config.provider ?? 'gemini',
        api_key: '',
        model_name: config.model_name ?? 'gemini-2.0-flash',
        system_prompt: config.system_prompt ?? '',
        context_messages: config.context_messages ?? 10,
      })
    }
  }, [config, perms['ai.configure']]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleToggleEnabled(val) {
    try {
      await update.mutateAsync({ enabled: val })
      toast.success(val ? 'AI agent enabled.' : 'AI agent disabled.')
    } catch {
      toast.error('Failed to update AI setting.')
    }
  }

  async function handleSaveConfig(e) {
    e.preventDefault()
    const payload = { ...form, context_messages: Number(form.context_messages) }
    if (!payload.api_key) delete payload.api_key
    try {
      await update.mutateAsync(payload)
      toast.success('AI config saved.')
      setForm((f) => ({ ...f, api_key: '' }))
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save.')
    }
  }

  function handleProviderChange(e) {
    const provider = e.target.value
    setForm((f) => ({ ...f, provider, model_name: DEFAULT_MODELS[provider] ?? '' }))
  }

  if (isLoading) return <SettingsLayout><div /></SettingsLayout>

  // Staff has no access — show a simple message
  if (!perms['ai.view']) {
    return (
      <SettingsLayout>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">AI Agent</h2>
          <p className="text-sm text-text-muted mt-0.5">Auto-reply configuration.</p>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-text-muted">You don't have permission to view AI settings.</p>
          </CardContent>
        </Card>
      </SettingsLayout>
    )
  }

  return (
    <SettingsLayout>
      <div>
        <h2 className="text-lg font-semibold text-text-primary">AI Agent</h2>
        <p className="text-sm text-text-muted mt-0.5">
          {perms['ai.configure']
            ? 'Configure the AI provider, credentials, and auto-reply behaviour.'
            : 'Enable or disable AI auto-replies for your business.'}
        </p>
      </div>

      {/* Enable / disable — admin + superadmin */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Auto-reply</CardTitle>
              <CardDescription>
                When enabled, the AI agent automatically replies to inbound customer messages.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs text-text-muted">{config?.enabled ? 'Enabled' : 'Disabled'}</span>
              <Toggle
                checked={config?.enabled ?? false}
                onChange={handleToggleEnabled}
                disabled={update.isPending || (!config?.has_api_key && !config?.enabled)}
              />
            </div>
          </div>
          {!config?.has_api_key && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {perms['ai.configure'] ? 'No API key saved — add one below to enable.' : 'No API key configured. Ask your super admin to add one.'}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Current status summary */}
      {config?.has_api_key && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] bg-surface-app border border-border-default text-xs text-text-secondary">
          <span className={`w-2 h-2 rounded-full shrink-0 ${config.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span>
            {config.enabled
              ? `AI is active · ${config.provider === 'gemini' ? 'Google Gemini' : 'OpenAI'} · ${config.model_name}`
              : `AI is disabled · ${config.provider === 'gemini' ? 'Google Gemini' : 'OpenAI'} · ${config.model_name}`}
          </span>
        </div>
      )}

      {/* Full config — superadmin only */}
      {perms['ai.configure'] && form && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Provider Configuration</CardTitle>
            <CardDescription>API credentials and model settings. Only super admins can update these.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveConfig} className="space-y-5">

              <div className="space-y-1.5">
                <Label>Provider</Label>
                <select
                  value={form.provider}
                  onChange={handleProviderChange}
                  className="w-full text-sm rounded-[var(--radius-sm)] border border-border-default bg-white px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>
                  API Key
                  {config?.has_api_key && (
                    <span className="ml-2 text-[10px] font-normal text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">key saved</span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    placeholder={config?.has_api_key ? 'Leave blank to keep existing key' : 'Paste API key…'}
                    value={form.api_key}
                    onChange={set('api_key')}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  >
                    {showKey
                      ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                      : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    }
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Model</Label>
                <Input
                  placeholder={DEFAULT_MODELS[form.provider] ?? ''}
                  value={form.model_name}
                  onChange={set('model_name')}
                />
                <p className="text-[11px] text-text-muted">
                  {form.provider === 'gemini' ? 'e.g. gemini-2.0-flash, gemini-1.5-pro' : 'e.g. gpt-4o-mini, gpt-4o'}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Context messages</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={form.context_messages}
                  onChange={set('context_messages')}
                  className="w-24"
                />
                <p className="text-[11px] text-text-muted">Recent messages included as context per AI reply.</p>
              </div>

              <Separator />

              <div className="space-y-1.5">
                <Label>System prompt</Label>
                <textarea
                  rows={6}
                  value={form.system_prompt}
                  onChange={(e) => setForm((f) => ({ ...f, system_prompt: e.target.value }))}
                  placeholder="You are a helpful support agent for Acme Corp. Only answer questions related to our products and services. Be concise and friendly…"
                  className="w-full text-sm rounded-[var(--radius-sm)] border border-border-default bg-white px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand resize-none"
                />
                <p className="text-[11px] text-text-muted">
                  Define the AI persona, knowledge scope, and tone. Customer name, phone, and email are automatically appended.
                </p>
              </div>

              <Button
                type="submit"
                size="sm"
                className="bg-brand hover:bg-brand-hover text-text-on-brand"
                disabled={update.isPending}
              >
                {update.isPending ? 'Saving…' : 'Save configuration'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </SettingsLayout>
  )
}
