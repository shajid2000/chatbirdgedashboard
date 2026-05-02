import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateKnowledgeChunk, useKnowledgeFromUrl } from '@/hooks/useKnowledge'

// ── Text helpers ────────────────────────────────────────────────────────────

function splitTextIntoChunks(text, maxChars = 800, overlap = 120) {
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 40)
  const chunks = []
  let current = ''
  for (const para of paragraphs) {
    if (para.length > maxChars) {
      if (current) { chunks.push(current.trim()); current = '' }
      const sents = para.split(/(?<=[.!?])\s+/)
      let buf = ''
      for (const s of sents) {
        if (buf.length + s.length > maxChars && buf) { chunks.push(buf.trim()); buf = s }
        else buf = buf ? buf + ' ' + s : s
      }
      if (buf) chunks.push(buf.trim())
    } else if (current.length + para.length + 2 > maxChars && current) {
      chunks.push(current.trim()); current = para
    } else {
      current = current ? current + '\n\n' + para : para
    }
  }
  if (current.trim()) chunks.push(current.trim())

  // Merge consecutive small chunks stranded between long paragraphs.
  const merged = []
  let acc = ''
  for (const c of chunks) {
    if (!acc) { acc = c }
    else if (acc.length + c.length + 2 <= maxChars) { acc = acc + '\n\n' + c }
    else { merged.push(acc); acc = c }
  }
  if (acc) merged.push(acc)

  // Prepend the tail of each preceding chunk to the next at a word boundary.
  if (overlap && merged.length > 1) {
    const overlapped = [merged[0]]
    for (let i = 1; i < merged.length; i++) {
      let tail = merged[i - 1].slice(-overlap)
      const wordStart = tail.indexOf(' ')
      if (wordStart !== -1) tail = tail.slice(wordStart + 1)
      overlapped.push(tail + '\n\n' + merged[i])
    }
    return overlapped
  }

  return merged
}

function parseCSV(text) {
  const rows = text.split('\n').filter(l => l.trim())
  if (!rows.length) return { headers: [], rows: [] }
  const headers = parseCSVLine(rows[0]).map(h => h.trim())
  return {
    headers,
    rows: rows.slice(1).map(line => {
      const vals = parseCSVLine(line)
      return Object.fromEntries(headers.map((h, i) => [h, (vals[i] || '').trim()]))
    }),
  }
}

function parseCSVLine(line) {
  const out = []; let cur = ''; let inQ = false
  for (const c of line) {
    if (c === '"') inQ = !inQ
    else if (c === ',' && !inQ) { out.push(cur); cur = '' }
    else cur += c
  }
  out.push(cur)
  return out
}

// ── Shared sub-components ───────────────────────────────────────────────────

function DropZone({ accept, onFile, file, label, hint }) {
  const [drag, setDrag] = useState(false)
  const inputRef = useRef()

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }, [onFile])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-[var(--radius-md)] px-6 py-8 text-center cursor-pointer transition-all ${
        drag ? 'border-brand bg-brand/5 scale-[1.01]'
        : file ? 'border-green-400 bg-green-50/60'
        : 'border-border-default hover:border-brand/40 hover:bg-surface-sidebar-item'
      }`}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
      {file ? (
        <div className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-text-primary">{file.name}</span>
          <span className="text-xs text-text-muted">({(file.size / 1024).toFixed(1)} KB)</span>
          <button type="button" onClick={(e) => { e.stopPropagation(); onFile(null) }}
            className="ml-1 text-text-muted hover:text-text-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <>
          <svg className="w-8 h-8 mx-auto text-text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16v-8m0 0l-3 3m3-3l3 3M4 16.5v1A2.5 2.5 0 006.5 20h11a2.5 2.5 0 002.5-2.5v-1" />
          </svg>
          <p className="text-sm font-medium text-text-primary">{label}</p>
          <p className="text-xs text-text-muted mt-1">{hint}</p>
        </>
      )}
    </div>
  )
}

function ImportProgress({ done, total }) {
  const pct = Math.round((done / total) * 100)
  return (
    <div className="space-y-1.5 py-1">
      <div className="flex justify-between text-xs text-text-muted">
        <span>Importing chunks…</span>
        <span>{done} / {total}</span>
      </div>
      <div className="h-1.5 bg-border-default rounded-full overflow-hidden">
        <div className="h-full bg-brand transition-all duration-300 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function ColumnSelect({ label, headers, value, onChange, required }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">
        {label} {required && <span className="text-red-500">*</span>}
        {!required && <span className="text-text-muted font-normal"> (optional)</span>}
      </Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs rounded-[var(--radius-sm)] border border-border-default bg-white px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
      >
        <option value="">— skip —</option>
        {headers.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
    </div>
  )
}

function PreviewTable({ headers, rows }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-sm)] border border-border-default text-xs">
      <table className="w-full">
        <thead className="bg-surface-sidebar-item">
          <tr>
            {headers.map(h => (
              <th key={h} className="px-3 py-1.5 text-left font-medium text-text-secondary truncate max-w-[120px]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 3).map((row, i) => (
            <tr key={i} className="border-t border-border-default">
              {headers.map(h => (
                <td key={h} className="px-3 py-1.5 text-text-secondary truncate max-w-[160px]">{row[h] || '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 3 && (
        <p className="px-3 py-1.5 text-[10px] text-text-muted border-t border-border-default bg-surface-sidebar-item">
          +{rows.length - 3} more rows
        </p>
      )}
    </div>
  )
}

function ModalFooter({ onClose, onImport, importLabel, disabled, progress }) {
  return (
    <div className="flex flex-col gap-3 pt-2">
      {progress && <ImportProgress done={progress.done} total={progress.total} />}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={!!progress}>Cancel</Button>
        <Button
          type="button" size="sm"
          className="bg-brand hover:bg-brand-hover text-text-on-brand"
          onClick={onImport} disabled={disabled || !!progress}
        >
          {progress ? `Importing… ${progress.done}/${progress.total}` : importLabel}
        </Button>
      </div>
    </div>
  )
}

// ── Tab: Write ───────────────────────────────────────────────────────────────

function WriteTab({ onClose }) {
  const create = useCreateKnowledgeChunk()
  const [form, setForm] = useState({ title: '', content: '', source: '' })
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  async function handleSave() {
    if (!form.content.trim()) return
    try {
      await create.mutateAsync({ title: form.title, content: form.content, source: form.source })
      toast.success('Knowledge chunk saved.')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || 'Failed to save.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1 space-y-1.5">
          <Label>Title <span className="text-text-muted font-normal text-xs">(optional)</span></Label>
          <Input value={form.title} onChange={set('title')} placeholder="e.g. Return Policy" />
        </div>
        <div className="w-32 space-y-1.5">
          <Label>Source tag</Label>
          <Input value={form.source} onChange={set('source')} placeholder="e.g. faq" />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Content <span className="text-red-500">*</span></Label>
          <span className="text-[11px] text-text-muted">{form.content.length} / 4000</span>
        </div>
        <textarea
          rows={9} maxLength={4000} value={form.content}
          onChange={(e) => setForm(p => ({ ...p, content: e.target.value }))}
          placeholder="Paste a FAQ answer, policy text, product description, or any factual content the AI should reference when answering customers."
          className="w-full text-sm rounded-[var(--radius-sm)] border border-border-default bg-white px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand resize-none"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" className="bg-brand hover:bg-brand-hover text-text-on-brand"
          onClick={handleSave} disabled={create.isPending || !form.content.trim()}>
          {create.isPending ? 'Saving…' : 'Save chunk'}
        </Button>
      </div>
    </div>
  )
}

// ── Tab: .txt ────────────────────────────────────────────────────────────────

function TxtTab({ onClose }) {
  const create = useCreateKnowledgeChunk()
  const [file, setFile] = useState(null)
  const [chunks, setChunks] = useState(null)
  const [source, setSource] = useState('')
  const [progress, setProgress] = useState(null)

  function handleFile(f) {
    if (!f) { setFile(null); setChunks(null); return }
    if (!f.name.toLowerCase().endsWith('.txt')) { toast.error('Please select a .txt file.'); return }
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => setChunks(splitTextIntoChunks(e.target.result))
    reader.readAsText(f)
  }

  async function handleImport() {
    if (!chunks?.length) return
    const items = chunks.map(c => ({ content: c, source: source || file.name.replace(/\.txt$/i, ''), title: '' }))
    setProgress({ done: 0, total: items.length })
    let ok = 0
    for (const item of items) {
      try { await create.mutateAsync(item); ok++ } catch {}
      setProgress(p => ({ ...p, done: p.done + 1 }))
    }
    toast.success(`${ok} of ${items.length} chunks imported.`)
    if (ok > 0) onClose(); else setProgress(null)
  }

  return (
    <div className="space-y-4">
      <DropZone
        accept=".txt" file={file} onFile={handleFile}
        label="Drop .txt file here" hint="or click to browse — plain text files only"
      />

      {chunks && (
        <>
          <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] bg-green-50 border border-green-200 text-xs text-green-700">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Parsed into <strong>{chunks.length} chunks</strong> — split at paragraph boundaries
          </div>

          <div className="space-y-1.5">
            <Label>Source tag <span className="text-text-muted font-normal text-xs">(optional)</span></Label>
            <Input value={source} onChange={(e) => setSource(e.target.value)}
              placeholder={file?.name.replace(/\.txt$/i, '') || 'e.g. policy-doc'} />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-text-secondary">Preview (first 2 chunks)</p>
            {chunks.slice(0, 2).map((c, i) => (
              <div key={i} className="px-3 py-2 rounded-[var(--radius-sm)] bg-surface-sidebar-item border border-border-default">
                <p className="text-[10px] text-text-muted mb-0.5">Chunk {i + 1}</p>
                <p className="text-xs text-text-secondary line-clamp-3">{c}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <ModalFooter onClose={onClose} onImport={handleImport}
        importLabel={chunks ? `Import ${chunks.length} chunks` : 'Import'}
        disabled={!chunks?.length} progress={progress} />
    </div>
  )
}

// ── Tab: CSV ─────────────────────────────────────────────────────────────────

function CsvTab({ onClose }) {
  const create = useCreateKnowledgeChunk()
  const [file, setFile] = useState(null)
  const [parsed, setParsed] = useState(null)
  const [map, setMap] = useState({ title: '', source: '' })
  const [progress, setProgress] = useState(null)

  function handleFile(f) {
    if (!f) { setFile(null); setParsed(null); return }
    if (!f.name.toLowerCase().endsWith('.csv')) { toast.error('Please select a .csv file.'); return }
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = parseCSV(e.target.result)
      setParsed(data)
      const lower = data.headers.map(h => h.toLowerCase())
      setMap({
        title: data.headers[lower.findIndex(h => h.includes('title') || h.includes('question') || h.includes('name'))] || '',
        source: data.headers[lower.findIndex(h => h.includes('source') || h.includes('category') || h.includes('tag'))] || '',
      })
    }
    reader.readAsText(f)
  }

  async function handleImport() {
    if (!parsed) return
    const contentHeaders = parsed.headers.filter(h => h !== map.title && h !== map.source)
    const items = parsed.rows
      .map(r => ({
        content: contentHeaders
          .map(h => ({ h, v: String(r[h] || '').trim() }))
          .filter(({ v }) => v)
          .map(({ h, v }) => `${h}: ${v}`)
          .join('\n'),
        title: map.title ? String(r[map.title] || '') : '',
        source: map.source ? String(r[map.source] || '') : '',
      }))
      .filter(item => item.content.trim())
    if (!items.length) { toast.error('No rows with content found.'); return }
    setProgress({ done: 0, total: items.length })
    let ok = 0
    for (const item of items) {
      try { await create.mutateAsync(item); ok++ } catch {}
      setProgress(p => ({ ...p, done: p.done + 1 }))
    }
    toast.success(`${ok} of ${items.length} rows imported.`)
    if (ok > 0) onClose(); else setProgress(null)
  }

  return (
    <div className="space-y-4">
      <DropZone
        accept=".csv" file={file} onFile={handleFile}
        label="Drop CSV file here" hint="or click to browse — UTF-8 CSV with header row"
      />

      {parsed && (
        <>
          <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] bg-blue-50 border border-blue-200 text-xs text-blue-700">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            {parsed.rows.length} rows detected · {parsed.headers.length} columns · all columns combined per row
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ColumnSelect label="Title column" headers={parsed.headers} value={map.title}
              onChange={(v) => setMap(m => ({ ...m, title: v }))} />
            <ColumnSelect label="Source column" headers={parsed.headers} value={map.source}
              onChange={(v) => setMap(m => ({ ...m, source: v }))} />
          </div>

          <div>
            <p className="text-xs font-medium text-text-secondary mb-1.5">Preview (first 3 rows)</p>
            <PreviewTable headers={parsed.headers} rows={parsed.rows} />
          </div>
        </>
      )}

      <ModalFooter onClose={onClose} onImport={handleImport}
        importLabel={parsed ? `Import ${parsed.rows.length} rows` : 'Import'}
        disabled={!parsed?.rows.length} progress={progress} />
    </div>
  )
}

// ── Tab: Excel ───────────────────────────────────────────────────────────────

function ExcelTab({ onClose }) {
  const create = useCreateKnowledgeChunk()
  const [file, setFile] = useState(null)
  const [sheets, setSheets] = useState([])
  const [sheet, setSheet] = useState('')
  const [parsed, setParsed] = useState(null)
  const [map, setMap] = useState({ title: '', source: '' })
  const [progress, setProgress] = useState(null)
  const [loadError, setLoadError] = useState(null)

  async function handleFile(f) {
    if (!f) { setFile(null); setSheets([]); setParsed(null); return }
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['xlsx', 'xls', 'ods'].includes(ext)) { toast.error('Please select an Excel file (.xlsx, .xls).'); return }
    setFile(f)
    setLoadError(null)
    try {
      const XLSX = await import('xlsx')
      const buf = await f.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      setSheets(wb.SheetNames)
      loadSheet(XLSX, wb, wb.SheetNames[0])
      setSheet(wb.SheetNames[0])
    } catch {
      setLoadError('Failed to parse Excel file. Make sure xlsx is installed (npm install).')
    }
  }

  function loadSheet(XLSX, wb, sheetName) {
    const ws = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
    if (!rows.length) { setParsed({ headers: [], rows: [] }); return }
    const headers = Object.keys(rows[0])
    const lower = headers.map(h => h.toLowerCase())
    setParsed({ headers, rows })
    setMap({
      title: headers[lower.findIndex(h => h.includes('title') || h.includes('question') || h.includes('name'))] || '',
      source: headers[lower.findIndex(h => h.includes('source') || h.includes('category') || h.includes('tag'))] || '',
    })
  }

  async function handleSheetChange(name) {
    setSheet(name)
    if (!file) return
    try {
      const XLSX = await import('xlsx')
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      loadSheet(XLSX, wb, name)
    } catch {}
  }

  async function handleImport() {
    if (!parsed) return
    const contentHeaders = parsed.headers.filter(h => h !== map.title && h !== map.source)
    const items = parsed.rows
      .map(r => ({
        content: contentHeaders
          .map(h => ({ h, v: String(r[h] || '').trim() }))
          .filter(({ v }) => v)
          .map(({ h, v }) => `${h}: ${v}`)
          .join('\n'),
        title: map.title ? String(r[map.title] || '') : '',
        source: map.source ? String(r[map.source] || '') : '',
      }))
      .filter(item => item.content.trim())
    if (!items.length) { toast.error('No rows with content found.'); return }
    setProgress({ done: 0, total: items.length })
    let ok = 0
    for (const item of items) {
      try { await create.mutateAsync(item); ok++ } catch {}
      setProgress(p => ({ ...p, done: p.done + 1 }))
    }
    toast.success(`${ok} of ${items.length} rows imported.`)
    if (ok > 0) onClose(); else setProgress(null)
  }

  return (
    <div className="space-y-4">
      <DropZone
        accept=".xlsx,.xls,.ods" file={file} onFile={handleFile}
        label="Drop Excel file here" hint="or click to browse — .xlsx, .xls supported"
      />

      {loadError && (
        <p className="text-xs text-red-600 px-3 py-2 rounded-[var(--radius-sm)] bg-red-50 border border-red-200">{loadError}</p>
      )}

      {sheets.length > 1 && (
        <div className="space-y-1.5">
          <Label className="text-xs">Sheet</Label>
          <div className="flex flex-wrap gap-1.5">
            {sheets.map(s => (
              <button key={s} type="button" onClick={() => handleSheetChange(s)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  s === sheet ? 'bg-brand text-white' : 'bg-surface-sidebar-item text-text-secondary hover:bg-border-default'
                }`}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {parsed?.headers.length > 0 && (
        <>
          <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M14 3v18" />
            </svg>
            {parsed.rows.length} rows · {parsed.headers.length} columns · sheet: <strong>{sheet}</strong> · all columns combined per row
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ColumnSelect label="Title column" headers={parsed.headers} value={map.title}
              onChange={(v) => setMap(m => ({ ...m, title: v }))} />
            <ColumnSelect label="Source column" headers={parsed.headers} value={map.source}
              onChange={(v) => setMap(m => ({ ...m, source: v }))} />
          </div>

          <div>
            <p className="text-xs font-medium text-text-secondary mb-1.5">Preview (first 3 rows)</p>
            <PreviewTable headers={parsed.headers} rows={parsed.rows} />
          </div>
        </>
      )}

      <ModalFooter onClose={onClose} onImport={handleImport}
        importLabel={parsed ? `Import ${parsed.rows.length} rows` : 'Import'}
        disabled={!parsed?.rows.length} progress={progress} />
    </div>
  )
}

// ── Tab: URL ─────────────────────────────────────────────────────────────────

function UrlTab({ onClose }) {
  const fromUrl = useKnowledgeFromUrl()
  const [url, setUrl] = useState('')
  const [source, setSource] = useState('')

  async function handleFetch() {
    if (!url.trim()) return
    try {
      const chunks = await fromUrl.mutateAsync({ url: url.trim(), source: source.trim() })
      toast.success(`${chunks.length} chunks imported from URL.`)
      onClose()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to fetch URL.'
      toast.error(msg)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-md)] bg-surface-sidebar-item border border-border-default px-4 py-3 text-xs text-text-muted space-y-1">
        <p className="font-medium text-text-secondary">How it works</p>
        <p>The server fetches the URL, extracts all text content, splits it into chunks, embeds each one, and saves them to your knowledge base. Up to 30 chunks per URL.</p>
      </div>

      <div className="space-y-1.5">
        <Label>URL <span className="text-red-500">*</span></Label>
        <Input
          type="url" value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="https://yoursite.com/pricing"
          onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Source tag <span className="text-text-muted font-normal text-xs">(optional)</span></Label>
        <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. website, docs, pricing-page" />
        <p className="text-[11px] text-text-muted">Defaults to the domain name if blank.</p>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={fromUrl.isPending}>Cancel</Button>
        <Button size="sm" className="bg-brand hover:bg-brand-hover text-text-on-brand"
          onClick={handleFetch} disabled={fromUrl.isPending || !url.trim()}>
          {fromUrl.isPending
            ? <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Fetching…
              </span>
            : 'Fetch & Import'
          }
        </Button>
      </div>
    </div>
  )
}

// ── Main modal ───────────────────────────────────────────────────────────────

const TABS = [
  {
    id: 'write',
    label: 'Write',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
  {
    id: 'txt',
    label: '.txt',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'csv',
    label: 'CSV',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M14 3v18" />
      </svg>
    ),
  },
  {
    id: 'excel',
    label: 'Excel',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'url',
    label: 'URL',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
]

export default function AddKnowledgeModal({ onClose }) {
  const [tab, setTab] = useState('write')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-[var(--radius-lg)] shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Add Knowledge</h3>
            <p className="text-xs text-text-muted mt-0.5">Choose a source to import from</p>
          </div>
          <button onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-[var(--radius-sm)] hover:bg-surface-sidebar-item">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-4 pt-3 pb-0 shrink-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-[var(--radius-sm)] text-xs font-medium transition-colors border-b-2 ${
                tab === t.id
                  ? 'text-brand border-brand bg-brand/5'
                  : 'text-text-muted border-transparent hover:text-text-secondary hover:bg-surface-sidebar-item'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
        <div className="h-px bg-border-default shrink-0" />

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'write' && <WriteTab onClose={onClose} />}
          {tab === 'txt'   && <TxtTab   onClose={onClose} />}
          {tab === 'csv'   && <CsvTab   onClose={onClose} />}
          {tab === 'excel' && <ExcelTab onClose={onClose} />}
          {tab === 'url'   && <UrlTab   onClose={onClose} />}
        </div>
      </div>
    </div>
  )
}
