export type Visit = {
  id: string
  name: string
  area: string
  notes: string
  /** ISO date yyyy-mm-dd */
  date: string
  lat: number
  lng: number
  /** Full JPEG/PNG/WebP data URL, or a generated SVG for seeded demos. */
  photo?: string
  /** Smaller encode of the same picture. Pins use this until the visit is selected. */
  thumb?: string
  /** Synthetic demo entries are never stored and can't be edited or deleted. */
  demo?: boolean
}

export const STORAGE_KEY = 'crema.journal'
export const BACKUP_KEY = 'crema.journal.backup'

export type JournalState = { version: 2; showDemos: boolean; entries: Visit[] }
