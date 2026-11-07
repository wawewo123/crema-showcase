import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { usePrefersReducedMotion } from '../lib/motion'
import { DEMO_VISITS } from './demo'
import { buildVisit, emptyState, exportDocument, upsertVisit, validateImport } from './migrate'
import { filterByMonth, monthLabel, monthTicks } from './months'
import { cardImageSrc } from './pins'
import { browserRepo } from './repo'
import { googleMapsUrl, resizePhoto } from './storage'
import type { JournalState, Visit } from './types'
import { VisitForm, type Draft } from './VisitForm'
import { MapView } from './MapView'

const today = () => new Date().toISOString().slice(0, 10)
const niceDate = (iso: string) => {
  const d = new Date(iso + 'T12:00:00')
  return Number.isNaN(+d) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
const blank = (): Draft => ({ name: '', area: '', notes: '', date: today() })

const STORAGE_LINE =
  'Saved only on this device, in this browser. A home-screen icon does not share storage with the browser tab. Export a backup before you clear data or switch browsers.'

export function Journal({ say, active, onDemos }: { say: (m: string) => void; active: boolean; onDemos: (on: boolean) => void }) {
  const reduced = usePrefersReducedMotion()
  const repo = useRef(browserRepo())
  const [store, setStore] = useState<JournalState | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [month, setMonth] = useState('all')
  const [mode, setMode] = useState<'add' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [placing, setPlacing] = useState(false)
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null)
  const [draft, setDraft] = useState<Draft>(blank)
  const [error, setError] = useState<string | null>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [fitKey, setFitKey] = useState(0)
  const [listOpen, setListOpen] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDialogElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancel = false
    repo.current.load().then((s) => {
      if (cancel) return
      setStore(s)
      onDemos(s.showDemos)
    })
    return () => {
      cancel = true
    }
  }, [onDemos])

  useEffect(() => {
    const dlg = listRef.current
    if (!dlg) return
    if (listOpen && !dlg.open) dlg.showModal()
    if (!listOpen && dlg.open) dlg.close()
  }, [listOpen])

  const visits = useMemo(() => {
    if (!store) return []
    return [...store.entries, ...(store.showDemos ? DEMO_VISITS : [])].sort((a, b) => b.date.localeCompare(a.date))
  }, [store])
  const shown = useMemo(() => filterByMonth(visits, month), [visits, month])
  const ticks = useMemo(() => monthTicks(visits), [visits])
  const selected = shown.find((v) => v.id === selectedId) ?? null

  const commit = async (next: JournalState) => {
    setStore(next)
    onDemos(next.showDemos)
    const result = await repo.current.save(next)
    setError(result.ok ? null : result.reason)
    return result.ok
  }

  const startAdd = () => {
    setMode('add')
    setEditingId(null)
    setDraft(blank())
    setPin(null)
    setPlacing(true)
    setSelectedId(null)
    setError(null)
    say('Adding a visit. Tap the map to drop a pin.')
  }
  const startEdit = (v: Visit) => {
    if (v.demo) return
    setMode('edit')
    setEditingId(v.id)
    setDraft({ name: v.name, area: v.area, notes: v.notes, date: v.date, photo: v.photo, thumb: v.thumb })
    setPin({ lat: v.lat, lng: v.lng })
    setPlacing(false)
    setError(null)
    setListOpen(false)
  }
  const cancel = () => {
    setMode(null)
    setEditingId(null)
    setPlacing(false)
    setPin(null)
  }
  const onPhoto = async (file: File | undefined) => {
    if (!file) return
    setPhotoBusy(true)
    try {
      const sized = await resizePhoto(file)
      setDraft((d) => ({ ...d, photo: sized.photo, thumb: sized.thumb }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That photo could not be read.')
    } finally {
      setPhotoBusy(false)
    }
  }
  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!store) return
    const built = buildVisit({
      id: editingId ?? undefined,
      name: draft.name,
      area: draft.area,
      notes: draft.notes,
      date: draft.date,
      pin,
      photo: draft.photo,
      thumb: draft.thumb,
    })
    if (!built.ok) {
      setError(built.error)
      if (!draft.name.trim()) nameRef.current?.focus()
      return
    }
    const ok = await commit({ ...store, entries: upsertVisit(store.entries, built.visit) })
    if (!ok) return
    setMode(null)
    setPlacing(false)
    setPin(null)
    setSelectedId(built.visit.id)
    say(editingId ? `Updated ${built.visit.name}` : `Saved ${built.visit.name} to your journal`)
  }
  const remove = async (v: Visit) => {
    if (!store || v.demo) return
    if (!window.confirm(`Delete “${v.name}” from your journal? This can't be undone.`)) return
    await commit({ ...store, entries: store.entries.filter((e) => e.id !== v.id) })
    setSelectedId(null)
    say(`Deleted ${v.name}`)
  }
  const centrePin = () => {
    const src = shown.length ? shown : [{ lat: 51.5072, lng: -0.1276 }]
    const lat = src.reduce((a, v) => a + v.lat, 0) / src.length
    const lng = src.reduce((a, v) => a + v.lng, 0) / src.length
    setPin({ lat, lng })
    setPlacing(false)
    say('Pin dropped. Fill in the visit details.')
    setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 40)
  }
  const download = () => {
    if (!store) return
    const json = exportDocument(store, new Date().toISOString())
    const blob = new Blob([json], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `crema-journal-${today()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    say('Journal backup downloaded')
  }
  const onImport = async (file: File | undefined) => {
    if (!file || !store) return
    const text = await file.text()
    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      setError('That file is not JSON.')
      return
    }
    const result = validateImport(data, text.length)
    if (!result.ok) {
      setError(result.errors.join(' '))
      return
    }
    if (!window.confirm('Replace the journal saved in this browser with this backup?')) return
    await commit(result.state)
    setSelectedId(null)
    setFitKey((k) => k + 1)
    say(`Imported ${result.state.entries.length} visits`)
  }
  const clearAll = async () => {
    if (!window.confirm('Remove every visit saved in this browser? Export a backup first if you want to keep them. Crema has no account to restore from.')) return
    await repo.current.clear()
    const next = emptyState()
    setStore(next)
    onDemos(next.showDemos)
    setSelectedId(null)
    setError(null)
    say('Journal cleared on this device')
  }

  if (!store) {
    return (
      <div className="journal" data-testid="journal-screen">
        <p className="quiet">Opening journal…</p>
      </div>
    )
  }

  return (
    <div className="journal" data-testid="journal-screen">
      <div className="map-stage">
        <MapView
          visits={shown}
          selectedId={mode ? null : selectedId}
          onSelect={setSelectedId}
          placing={placing}
          draftPin={pin}
          onPlace={(p) => {
            setPin(p)
            setPlacing(false)
            say('Pin dropped. Fill in the visit details.')
            setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 40)
          }}
          reduced={reduced}
          fitKey={fitKey}
          active={active}
        />
        {placing && (
          <p className="place-hint" role="status">
            Tap the map where the café is
          </p>
        )}
        {selected && !mode && (
          <article className="place-card" aria-label={selected.name} data-testid="place-card">
            {cardImageSrc(selected) ? (
              <img data-testid="place-photo" src={cardImageSrc(selected)} alt="" />
            ) : (
              <span className="place-fallback">{selected.name.charAt(0).toUpperCase()}</span>
            )}
            <div className="place-copy">
              <h2>{selected.name}</h2>
              <p>{selected.demo ? `Demo visit · ${monthLabel(selected.date.slice(0, 7))}` : `${selected.area || 'Pinned location'} · ${niceDate(selected.date)}`}</p>
              {selected.notes && <p className="place-notes">{selected.notes}</p>}
              <a className="btn small" href={googleMapsUrl(selected)} target="_blank" rel="noopener noreferrer">
                Open in Maps
              </a>
              {!selected.demo && (
                <button type="button" className="text-btn" data-testid="edit-visit" onClick={() => startEdit(selected)}>
                  Edit
                </button>
              )}
              {!selected.demo && (
                <button type="button" className="text-btn danger" onClick={() => remove(selected)}>
                  Delete
                </button>
              )}
              {selected.demo && <p className="quiet">Fictional café. The Maps link opens approximate coordinates.</p>}
            </div>
          </article>
        )}
      </div>

      <div className="dock">
        {mode ? (
          <VisitForm
            title={mode === 'edit' ? 'Edit visit' : 'Add coffee'}
            draft={draft}
            setDraft={setDraft}
            pin={pin}
            photoBusy={photoBusy}
            error={error}
            onDropCentre={centrePin}
            onMove={() => setPlacing(true)}
            onPhoto={onPhoto}
            onRemovePhoto={() => setDraft((d) => ({ ...d, photo: undefined, thumb: undefined }))}
            onSubmit={save}
            onCancel={cancel}
            nameRef={nameRef}
          />
        ) : (
          <>
            <div className="timeline" role="radiogroup" aria-label="Filter visits by month">
              {ticks.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="radio"
                  aria-checked={month === t.key}
                  className={month === t.key ? 'tick on' : 'tick'}
                  onClick={() => {
                    setMonth(t.key)
                    setFitKey((k) => k + 1)
                    setSelectedId((id) => (id && filterByMonth(visits, t.key).some((v) => v.id === id) ? id : null))
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button type="button" className="add-coffee" data-testid="add-coffee" onClick={startAdd}>
              <span aria-hidden="true">+</span>
              Add coffee
            </button>
            <button type="button" className="text-btn" data-testid="all-visits" onClick={() => setListOpen(true)}>
              All visits
            </button>
            <p className="storage-note">{STORAGE_LINE}</p>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </div>

      <dialog ref={listRef} className="drawer list-dialog" aria-labelledby="listH" onClose={() => setListOpen(false)}>
        <div className="drawer-body">
          <header className="drawer-h">
            <h2 id="listH">All visits</h2>
            <button type="button" className="icon-btn" aria-label="Close visit list" onClick={() => setListOpen(false)}>
              ×
            </button>
          </header>
          <label className="toggle">
            <input
              type="checkbox"
              checked={store.showDemos}
              onChange={(e) => {
                commit({ ...store, showDemos: e.target.checked })
                setSelectedId(null)
                setFitKey((k) => k + 1)
              }}
            />
            Show sample cafés
          </label>
          {shown.length === 0 ? (
            <p className="quiet">No visits in this view. Add one, or switch sample cafés back on.</p>
          ) : (
            <ul className="visit-list">
              {shown.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    className="visit"
                    aria-pressed={v.id === selectedId}
                    onClick={() => {
                      setSelectedId(v.id)
                      setListOpen(false)
                    }}
                  >
                    <span className="visit-name">{v.name}</span>
                    <span className="visit-meta">
                      {v.demo ? 'Demo visit' : 'Your visit'} · {niceDate(v.date)}
                    </span>
                  </button>
                  {!v.demo && (
                    <button type="button" className="text-btn" onClick={() => startEdit(v)}>
                      Edit {v.name}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <section className="backup" aria-labelledby="backupH">
            <h3 id="backupH">Backup</h3>
            <p className="quiet">{STORAGE_LINE}</p>
            <div className="row-btns">
              <button type="button" className="btn" onClick={download}>
                Export backup
              </button>
              <button type="button" className="btn ghost" onClick={() => fileRef.current?.click()}>
                Import backup
              </button>
              <button type="button" className="btn ghost danger" onClick={clearAll}>
                Clear journal
              </button>
            </div>
            <input
              ref={fileRef}
              className="sr"
              type="file"
              accept="application/json,.json"
              aria-label="Import journal backup"
              onChange={(e) => {
                onImport(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </section>
        </div>
      </dialog>
    </div>
  )
}
