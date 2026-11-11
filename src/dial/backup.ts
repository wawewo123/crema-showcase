import { validateImport } from '../journal/migrate'
import type { JournalState } from '../journal/types'
import { emptyDial, type DialState } from './state'

export type BackupResult =
  | { ok: true; journal: JournalState | null; dial: DialState | null }
  | { ok: false; errors: string[] }

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

export function exportAll(journal: JournalState, dial: DialState, nowIso: string): string {
  const entries = journal.entries
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
  return JSON.stringify(
    {
      version: 3,
      exportedAt: nowIso,
      journal: { version: 2, showDemos: journal.showDemos, entries },
      dial,
    },
    null,
    2,
  )
}

function readDial(raw: unknown): DialState | null {
  if (!isRecord(raw)) return null
  if (!Array.isArray(raw.setups) || !Array.isArray(raw.beans) || !Array.isArray(raw.brews)) return null
  if (!isRecord(raw.overrides)) return null
  const machines = isRecord(raw.overrides.machines) ? raw.overrides.machines : null
  const grinders = isRecord(raw.overrides.grinders) ? raw.overrides.grinders : null
  if (!machines || !grinders) return null
  return {
    version: 1,
    setups: raw.setups as DialState['setups'],
    activeSetupId: typeof raw.activeSetupId === 'string' ? raw.activeSetupId : null,
    overrides: { machines: machines as DialState['overrides']['machines'], grinders: grinders as DialState['overrides']['grinders'] },
    beans: raw.beans as DialState['beans'],
    brews: raw.brews as DialState['brews'],
  }
}

export function validateBackup(data: unknown, rawLength: number): BackupResult {
  if (rawLength > 12_000_000) return { ok: false, errors: ['That backup is larger than 12 MB.'] }
  if (!isRecord(data)) return { ok: false, errors: ['The file was not a Crema backup.'] }
  if (data.version === 1 || data.version === 2) {
    const journal = validateImport(data, rawLength)
    if (!journal.ok) return journal
    return { ok: true, journal: journal.state, dial: null }
  }
  if (data.version !== 3) return { ok: false, errors: ['Unsupported backup version.'] }
  const journal = validateImport({ ...(isRecord(data.journal) ? data.journal : {}), version: 2 }, rawLength)
  if (!journal.ok) return { ok: false, errors: journal.errors }
  const dial = readDial(data.dial)
  if (!dial) return { ok: false, errors: ['The dial-in section of the backup could not be read.'] }
  return { ok: true, journal: journal.state, dial: dial.version ? dial : emptyDial() }
}
