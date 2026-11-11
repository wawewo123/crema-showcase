import { newId } from './storage'
import type { JournalState, Visit } from './types'

const MAX_IMPORT_CHARS = 12_000_000
const PHOTO_RE = /^data:image\/(jpeg|jpg|png|webp);base64,[a-z0-9+/=\s]+$/i
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function emptyState(): JournalState {
  return { version: 2, showDemos: true, entries: [] }
}

export type MigrateResult =
  | { ok: true; kind: 'v1' | 'v2' | 'mirror'; state: JournalState }
  | { ok: false; reason: string }

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function finiteIn(n: unknown, min: number, max: number): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max
}

function keepStoredPhoto(p: unknown): string | undefined {
  if (typeof p !== 'string') return undefined
  if (!p.startsWith('data:image/')) return undefined
  if (p.length > 8_000_000) return undefined
  return p
}

/** Lenient read of a visit already on disk. Drops rows with no coordinates. Forces demo off. */
function coerceStored(raw: unknown): Visit | null {
  if (!isRecord(raw)) return null
  if (typeof raw.id !== 'string' || !raw.id.trim()) return null
  if (!finiteIn(raw.lat, -90, 90) || !finiteIn(raw.lng, -180, 180)) return null
  const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 80) : 'Untitled café'
  const date = typeof raw.date === 'string' && isRealDate(raw.date) ? raw.date : new Date().toISOString().slice(0, 10)
  return {
    id: raw.id.slice(0, 80),
    name,
    area: typeof raw.area === 'string' ? raw.area.slice(0, 160) : '',
    notes: typeof raw.notes === 'string' ? raw.notes.slice(0, 2000) : '',
    date,
    lat: raw.lat,
    lng: raw.lng,
    photo: keepStoredPhoto(raw.photo),
    thumb: keepStoredPhoto(raw.thumb),
    demo: false,
  }
}

export function isRealDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  if (m < 1 || m > 12 || d < 1 || d > 31) return false
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

export function migrateRaw(data: unknown): MigrateResult {
  if (!isRecord(data)) return { ok: false, reason: 'Journal data was not an object.' }
  if (data.version !== 1 && data.version !== 2) return { ok: false, reason: 'Unsupported journal version.' }
  if (!Array.isArray(data.entries)) return { ok: false, reason: 'Journal entries were missing.' }
  const entries = data.entries.map(coerceStored).filter((v): v is Visit => !!v)
  const kind = data.version === 1 ? 'v1' : data.kind === 'mirror' ? 'mirror' : 'v2'
  return {
    ok: true,
    kind,
    state: { version: 2, showDemos: data.showDemos !== false, entries },
  }
}

export function exportDocument(state: JournalState, nowIso: string): string {
  const entries = state.entries
    .filter((e) => !e.demo)
    .map((e) => ({
      id: e.id,
      name: e.name,
      area: e.area,
      notes: e.notes,
      date: e.date,
      lat: e.lat,
      lng: e.lng,
      ...(e.photo ? { photo: e.photo } : {}),
      ...(e.thumb ? { thumb: e.thumb } : {}),
    }))
  return JSON.stringify({ version: 2, exportedAt: nowIso, showDemos: state.showDemos, entries }, null, 2)
}

export type ImportResult = { ok: true; state: JournalState } | { ok: false; errors: string[] }

function photoError(label: string, value: unknown): string | null {
  if (value == null || value === '') return null
  if (typeof value !== 'string' || !PHOTO_RE.test(value)) return `${label} must be a JPEG, PNG, or WebP data URL.`
  return null
}

export function validateImport(data: unknown, rawLength: number): ImportResult {
  if (rawLength > MAX_IMPORT_CHARS) return { ok: false, errors: ['That backup is larger than 12 MB.'] }
  if (!isRecord(data)) return { ok: false, errors: ['The file was not a Crema journal.'] }
  if (data.version !== 1 && data.version !== 2) return { ok: false, errors: ['Unsupported journal version.'] }
  if (!Array.isArray(data.entries)) return { ok: false, errors: ['The file has no entries list.'] }
  const errors: string[] = []
  const seen = new Set<string>()
  const entries: Visit[] = []
  data.entries.forEach((raw, index) => {
    const where = `Entry ${index + 1}`
    if (!isRecord(raw)) {
      errors.push(`${where} is not an object.`)
      return
    }
    const id = typeof raw.id === 'string' ? raw.id.trim() : ''
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id)) errors.push(`${where} has a missing or invalid id.`)
    else if (seen.has(id)) errors.push(`${where} repeats id ${id}.`)
    else seen.add(id)
    const name = typeof raw.name === 'string' ? raw.name.trim() : ''
    if (!name || name.length > 80) errors.push(`${where} needs a name of 1–80 characters.`)
    if (!finiteIn(raw.lat, -90, 90) || !finiteIn(raw.lng, -180, 180)) errors.push(`${where} has coordinates outside the map.`)
    const date = typeof raw.date === 'string' ? raw.date : ''
    if (!isRealDate(date)) errors.push(`${where} needs a date as YYYY-MM-DD.`)
    const area = typeof raw.area === 'string' ? raw.area : ''
    const notes = typeof raw.notes === 'string' ? raw.notes : ''
    if (area.length > 160) errors.push(`${where} area is too long.`)
    if (notes.length > 2000) errors.push(`${where} notes are too long.`)
    const photoErr = photoError(`${where} photo`, raw.photo)
    const thumbErr = photoError(`${where} thumb`, raw.thumb)
    if (photoErr) errors.push(photoErr)
    if (thumbErr) errors.push(thumbErr)
    if (errors.length > 8) return
    if (
      /^[a-zA-Z0-9_-]{1,80}$/.test(id) &&
      name &&
      name.length <= 80 &&
      finiteIn(raw.lat, -90, 90) &&
      finiteIn(raw.lng, -180, 180) &&
      isRealDate(date) &&
      area.length <= 160 &&
      notes.length <= 2000 &&
      !photoErr &&
      !thumbErr
    ) {
      entries.push({
        id,
        name,
        area,
        notes,
        date,
        lat: raw.lat,
        lng: raw.lng,
        photo: typeof raw.photo === 'string' ? raw.photo : undefined,
        thumb: typeof raw.thumb === 'string' ? raw.thumb : undefined,
        demo: false,
      })
    }
  })
  if (errors.length) return { ok: false, errors: errors.slice(0, 8) }
  return {
    ok: true,
    state: { version: 2, showDemos: data.showDemos !== false, entries },
  }
}

export function upsertVisit(entries: Visit[], visit: Visit): Visit[] {
  const i = entries.findIndex((e) => e.id === visit.id)
  if (i === -1) return [visit, ...entries]
  const next = entries.slice()
  next[i] = visit
  return next
}

export function buildVisit(input: {
  id?: string
  name: string
  area: string
  notes: string
  date: string
  pin: { lat: number; lng: number } | null
  photo?: string
  thumb?: string
}): { ok: true; visit: Visit } | { ok: false; error: string } {
  const name = input.name.trim()
  if (!name) return { ok: false, error: 'Give the café a name.' }
  if (!input.pin) return { ok: false, error: 'Drop a pin on the map first (or use “Drop pin at centre”).' }
  return {
    ok: true,
    visit: {
      id: input.id ?? newId(),
      name: name.slice(0, 80),
      area: input.area.trim().slice(0, 160),
      notes: input.notes.trim().slice(0, 2000),
      date: isRealDate(input.date) ? input.date : new Date().toISOString().slice(0, 10),
      lat: input.pin.lat,
      lng: input.pin.lng,
      photo: input.photo,
      thumb: input.thumb,
    },
  }
}
