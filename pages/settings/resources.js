import { useState } from 'react'
import { toast } from 'sonner'
import SettingsLayout from '@/components/settings/SettingsLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  useResourceTypes, useCreateResourceType, useDeleteResourceType,
  useResources, useCreateResource, useDeleteResource,
  useAvailabilityEntries, useCreateAvailabilityEntry, useDeleteAvailabilityEntry,
} from '@/hooks/useResources'

// ── Shared ────────────────────────────────────────────────────────────────────

function TabBar({ tab, setTab }) {
  const tabs = [
    { id: 'types',        label: 'Resource Types' },
    { id: 'resources',    label: 'Resources' },
    { id: 'availability', label: 'Availability Notes' },
  ]
  return (
    <div className="flex gap-0 border-b border-border-default mb-6">
      {tabs.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            tab === t.id
              ? 'border-brand text-brand'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

function DeleteBtn({ onClick }) {
  return (
    <button onClick={onClick} className="text-text-muted hover:text-red-500 p-1 shrink-0">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  )
}

// ── Field schema builder (for Resource Types) ─────────────────────────────────

const FIELD_TYPES = ['string', 'number', 'boolean']

function FieldSchemaBuilder({ schema, onChange }) {
  return (
    <div className="space-y-2">
      {schema.map((field, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input placeholder="name (e.g. ac)" value={field.name}
            onChange={e => onChange(schema.map((f, idx) => idx === i ? { ...f, name: e.target.value } : f))}
            className="text-xs h-8 flex-1" />
          <Input placeholder="label (e.g. Air Conditioning)" value={field.label}
            onChange={e => onChange(schema.map((f, idx) => idx === i ? { ...f, label: e.target.value } : f))}
            className="text-xs h-8 flex-1" />
          <select value={field.type}
            onChange={e => onChange(schema.map((f, idx) => idx === i ? { ...f, type: e.target.value } : f))}
            className="text-xs h-8 border border-border-default rounded px-2 bg-surface-app text-text-primary">
            {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={() => onChange(schema.filter((_, idx) => idx !== i))}
            className="text-text-muted hover:text-red-500 p-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...schema, { name: '', type: 'string', label: '' }])}
        className="text-xs text-brand hover:underline flex items-center gap-1 mt-1">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        Add field
      </button>
    </div>
  )
}

// ── Resource Types tab ────────────────────────────────────────────────────────

function ResourceTypesTab() {
  const { data: types = [], isLoading } = useResourceTypes()
  const create = useCreateResourceType()
  const del    = useDeleteResourceType()
  const [show, setShow] = useState(false)
  const [name, setName] = useState('')
  const [schema, setSchema] = useState([])

  async function handleCreate() {
    if (!name.trim()) return
    try {
      await create.mutateAsync({ name: name.trim(), field_schema: schema })
      toast.success('Resource type created')
      setName(''); setSchema([]); setShow(false)
    } catch { toast.error('Failed to create resource type') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">
          Define the kinds of resources your business offers (Room, Table, Bed, Course, etc.).
        </p>
        <Button size="sm" onClick={() => setShow(v => !v)}
          className="bg-brand hover:bg-brand-hover text-text-on-brand gap-1.5 text-xs h-8">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Type
        </Button>
      </div>

      {show && (
        <Card><CardContent className="pt-4 space-y-3">
          <Input placeholder="Type name (e.g. Room)" value={name}
            onChange={e => setName(e.target.value)} className="text-sm" />
          <div>
            <p className="text-xs font-medium text-text-secondary mb-2">Custom fields</p>
            <FieldSchemaBuilder schema={schema} onChange={setSchema} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleCreate} disabled={create.isPending}
              className="bg-brand hover:bg-brand-hover text-text-on-brand text-xs h-8">
              {create.isPending ? 'Saving…' : 'Save'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShow(false)} className="text-xs h-8">Cancel</Button>
          </div>
        </CardContent></Card>
      )}

      {isLoading ? <p className="text-xs text-text-muted py-4">Loading…</p>
        : types.length === 0 ? <p className="text-xs text-text-muted py-8 text-center">No resource types yet.</p>
        : (
          <div className="space-y-2">
            {types.map(t => (
              <Card key={t.id}><CardContent className="py-3 px-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{t.name}</p>
                  {t.field_schema?.length > 0 && (
                    <p className="text-xs text-text-muted mt-0.5">
                      Fields: {t.field_schema.map(f => f.label || f.name).join(', ')}
                    </p>
                  )}
                </div>
                <DeleteBtn onClick={() => del.mutate(t.id)} />
              </CardContent></Card>
            ))}
          </div>
        )}
    </div>
  )
}

// ── Resources tab ─────────────────────────────────────────────────────────────

function ResourcesTab() {
  const { data: types = [] }     = useResourceTypes()
  const [typeId, setTypeId]       = useState('')
  const { data: resources = [], isLoading } = useResources({ typeId })
  const create = useCreateResource()
  const del    = useDeleteResource()

  const [show, setShow]   = useState(false)
  const [form, setForm]   = useState({ name: '', description: '', base_price: '', resource_type_id: '', attributes: {} })
  const selectedType      = types.find(t => t.id === form.resource_type_id)
  const selectedSchema    = selectedType?.field_schema || []

  async function handleCreate() {
    if (!form.name.trim() || !form.resource_type_id) {
      toast.error('Name and type are required')
      return
    }
    try {
      await create.mutateAsync({
        name: form.name.trim(),
        description: form.description,
        base_price: form.base_price || null,
        resource_type_id: form.resource_type_id,
        attributes: form.attributes,
      })
      toast.success('Resource created')
      setForm({ name: '', description: '', base_price: '', resource_type_id: '', attributes: {} })
      setShow(false)
    } catch { toast.error('Failed to create resource') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <select value={typeId} onChange={e => setTypeId(e.target.value)}
          className="text-xs h-8 border border-border-default rounded px-2 bg-surface-app text-text-primary">
          <option value="">All types</option>
          {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <Button size="sm" onClick={() => setShow(v => !v)}
          className="bg-brand hover:bg-brand-hover text-text-on-brand gap-1.5 text-xs h-8">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Resource
        </Button>
      </div>

      {show && (
        <Card><CardContent className="pt-4 space-y-3">
          <div>
            <label className="block text-xs text-text-secondary mb-1">Type</label>
            <select value={form.resource_type_id}
              onChange={e => setForm(f => ({ ...f, resource_type_id: e.target.value, attributes: {} }))}
              className="w-full text-xs h-8 border border-border-default rounded px-2 bg-surface-app text-text-primary">
              <option value="">Select a type…</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <Input placeholder="Name (e.g. Deluxe Room 101)" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="text-sm" />
          <Input placeholder="Description (optional)" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="text-sm" />
          <Input type="number" placeholder="Base price (optional)" value={form.base_price}
            onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))} className="text-sm" />

          {selectedSchema.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-text-secondary">Attributes</p>
              {selectedSchema.map(field => (
                <div key={field.name}>
                  {field.type === 'boolean' ? (
                    <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                      <input type="checkbox" checked={!!form.attributes[field.name]}
                        onChange={e => setForm(f => ({ ...f, attributes: { ...f.attributes, [field.name]: e.target.checked } }))}
                        className="rounded" />
                      {field.label || field.name}
                    </label>
                  ) : (
                    <>
                      <label className="block text-xs text-text-secondary mb-1">{field.label || field.name}</label>
                      <Input type={field.type === 'number' ? 'number' : 'text'}
                        value={form.attributes[field.name] ?? ''}
                        onChange={e => setForm(f => ({
                          ...f,
                          attributes: { ...f.attributes, [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value },
                        }))}
                        className="text-xs h-8" />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleCreate} disabled={create.isPending}
              className="bg-brand hover:bg-brand-hover text-text-on-brand text-xs h-8">
              {create.isPending ? 'Saving…' : 'Save'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShow(false)} className="text-xs h-8">Cancel</Button>
          </div>
        </CardContent></Card>
      )}

      {isLoading ? <p className="text-xs text-text-muted py-4">Loading…</p>
        : resources.length === 0 ? <p className="text-xs text-text-muted py-8 text-center">No resources yet.</p>
        : (
          <div className="space-y-2">
            {resources.map(r => (
              <Card key={r.id}><CardContent className="py-3 px-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-primary truncate">{r.name}</p>
                    <span className="shrink-0 text-[10px] bg-surface-sidebar-item text-text-muted px-1.5 py-0.5 rounded">
                      {r.resource_type_name}
                    </span>
                    {!r.is_active && (
                      <span className="shrink-0 text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded">inactive</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {r.base_price && <span className="text-xs text-text-muted">${r.base_price}</span>}
                    {Object.keys(r.attributes || {}).length > 0 && (
                      <span className="text-xs text-text-muted">
                        {Object.entries(r.attributes).map(([k, v]) => `${k}: ${String(v)}`).join(' · ')}
                      </span>
                    )}
                  </div>
                </div>
                <DeleteBtn onClick={() => del.mutate(r.id)} />
              </CardContent></Card>
            ))}
          </div>
        )}
    </div>
  )
}

// ── Availability Notes tab ────────────────────────────────────────────────────

function AvailabilityTab() {
  const { data: types = [] }     = useResourceTypes()
  const { data: resources = [] } = useResources()

  const today = new Date().toISOString().split('T')[0]
  const [filterDate, setFilterDate] = useState(today)

  const { data: entries = [], isLoading } = useAvailabilityEntries({ date: filterDate })
  const create = useCreateAvailabilityEntry()
  const del    = useDeleteAvailabilityEntry()

  const [show, setShow] = useState(false)
  const [form, setForm] = useState({
    date: today, start_time: '', end_time: '',
    resource_type_id: '', resource_id: '', note: '',
  })

  async function handleCreate() {
    if (!form.date || !form.note.trim()) {
      toast.error('Date and note are required')
      return
    }
    try {
      await create.mutateAsync({
        date:             form.date,
        start_time:       form.start_time || null,
        end_time:         form.end_time || null,
        resource_type_id: form.resource_type_id || null,
        resource_id:      form.resource_id || null,
        note:             form.note.trim(),
      })
      toast.success('Availability note added')
      setForm(f => ({ ...f, start_time: '', end_time: '', resource_type_id: '', resource_id: '', note: '' }))
      setShow(false)
      setFilterDate(form.date)
    } catch { toast.error('Failed to add note') }
  }

  function formatTime(t) {
    if (!t) return null
    return t.slice(0, 5)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-text-muted mb-2">
            Add plain-text notes about what is occupied or available on a given date.
            The AI reads these notes to answer customer questions.
          </p>
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-secondary">Browse date:</label>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
              className="text-xs h-8 border border-border-default rounded px-2 bg-surface-app text-text-primary" />
          </div>
        </div>
        <Button size="sm" onClick={() => setShow(v => !v)}
          className="bg-brand hover:bg-brand-hover text-text-on-brand gap-1.5 text-xs h-8 shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Note
        </Button>
      </div>

      {show && (
        <Card><CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full text-xs h-8 border border-border-default rounded px-2 bg-surface-app text-text-primary" />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Start time (optional)</label>
              <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                className="w-full text-xs h-8 border border-border-default rounded px-2 bg-surface-app text-text-primary" />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">End time (optional)</label>
              <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                className="w-full text-xs h-8 border border-border-default rounded px-2 bg-surface-app text-text-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Resource type (optional)</label>
              <select value={form.resource_type_id}
                onChange={e => setForm(f => ({ ...f, resource_type_id: e.target.value, resource_id: '' }))}
                className="w-full text-xs h-8 border border-border-default rounded px-2 bg-surface-app text-text-primary">
                <option value="">All types</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Specific resource (optional)</label>
              <select value={form.resource_id} onChange={e => setForm(f => ({ ...f, resource_id: e.target.value }))}
                className="w-full text-xs h-8 border border-border-default rounded px-2 bg-surface-app text-text-primary">
                <option value="">Any</option>
                {resources
                  .filter(r => !form.resource_type_id || r.resource_type_id === form.resource_type_id)
                  .map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1">Note</label>
            <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="e.g. 3 deluxe rooms occupied, 2 available  |  Dr. Smith on leave  |  Fully booked for evening"
              rows={2}
              className="w-full text-xs border border-border-default rounded px-3 py-2 bg-surface-app text-text-primary resize-none focus:outline-none focus:ring-1 focus:ring-brand" />
          </div>

          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleCreate} disabled={create.isPending}
              className="bg-brand hover:bg-brand-hover text-text-on-brand text-xs h-8">
              {create.isPending ? 'Saving…' : 'Save'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShow(false)} className="text-xs h-8">Cancel</Button>
          </div>
        </CardContent></Card>
      )}

      {isLoading ? <p className="text-xs text-text-muted py-4">Loading…</p>
        : entries.length === 0 ? (
          <p className="text-xs text-text-muted py-8 text-center">
            No notes for {filterDate}. The AI will tell customers nothing has been marked as unavailable.
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map(e => (
              <Card key={e.id}><CardContent className="py-3 px-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-text-primary">{e.date}</span>
                    {(e.start_time || e.end_time) && (
                      <span className="text-xs text-text-muted">
                        {formatTime(e.start_time)}{e.end_time ? ` – ${formatTime(e.end_time)}` : ''}
                      </span>
                    )}
                    {e.resource_type_name && (
                      <span className="text-[10px] bg-surface-sidebar-item text-text-muted px-1.5 py-0.5 rounded">
                        {e.resource_type_name}
                      </span>
                    )}
                    {e.resource_name && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                        {e.resource_name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mt-1">{e.note}</p>
                </div>
                <DeleteBtn onClick={() => del.mutate(e.id)} />
              </CardContent></Card>
            ))}
          </div>
        )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ResourcesPage() {
  const [tab, setTab] = useState('types')

  return (
    <SettingsLayout>
      <div>
        <h2 className="text-base font-semibold text-text-primary">Resources</h2>
        <p className="text-xs text-text-muted mt-0.5">
          Define your resources and add availability notes so the AI can answer customer questions.
        </p>
      </div>

      <TabBar tab={tab} setTab={setTab} />

      {tab === 'types'        && <ResourceTypesTab />}
      {tab === 'resources'    && <ResourcesTab />}
      {tab === 'availability' && <AvailabilityTab />}
    </SettingsLayout>
  )
}
