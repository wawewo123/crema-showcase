import { describe, expect, it } from 'vitest'
import { buildVisit, exportDocument, migrateRaw, upsertVisit, validateImport } from './migrate'
import type { Visit } from './types'

const photo = 'data:image/jpeg;base64,aaaa'

const mine: Visit = {
  id: 'v-1',
  name: 'Corner bar',
  area: 'Hackney',
  notes: 'Flat white',
  date: '2026-10-02',
  lat: 51.5,
  lng: -0.1,
  photo,
  demo: false,
}

describe('journal migration and backup', () => {
  it('migrates a version 1 document and refuses to keep demo flags', () => {
    const migrated = migrateRaw({
      version: 1,
      showDemos: true,
      entries: [{ ...mine, demo: true, photo: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>' }],
    })
    expect(migrated.ok).toBe(true)
    if (!migrated.ok) return
    expect(migrated.kind).toBe('v1')
    expect(migrated.state.entries[0].demo).toBe(false)
    expect(migrated.state.entries[0].photo?.startsWith('data:image/')).toBe(true)
  })

  it('rejects an unknown version', () => {
    expect(migrateRaw({ version: 9, entries: [] }).ok).toBe(false)
    expect(migrateRaw('{').ok).toBe(false)
  })

  it('round-trips user entries and leaves seeded cafés out of the file', () => {
    const json = exportDocument(
      {
        version: 2,
        showDemos: false,
        entries: [mine, { ...mine, id: 'demo-kiln', demo: true, name: 'Kiln' }],
      },
      '2026-11-07T00:00:00.000Z',
    )
    const back = validateImport(JSON.parse(json), json.length)
    expect(back.ok).toBe(true)
    if (!back.ok) return
    expect(back.state.showDemos).toBe(false)
    expect(back.state.entries.map((e) => e.id)).toEqual(['v-1'])
    expect(back.state.entries[0].photo).toBe(photo)
  })

  it('rejects a bad latitude and does not invent entries', () => {
    const bad = validateImport({ version: 2, entries: [{ ...mine, lat: 120 }] }, 100)
    expect(bad.ok).toBe(false)
    if (bad.ok) return
    expect(bad.errors.some((e) => e.includes('coordinates'))).toBe(true)
  })

  it('rejects a file over 12 MB', () => {
    const big = validateImport({ version: 2, entries: [] }, 12_000_001)
    expect(big.ok).toBe(false)
  })

  it('builds and updates a visit', () => {
    const missing = buildVisit({ name: '  ', area: '', notes: '', date: '2026-10-02', pin: { lat: 1, lng: 2 } })
    expect(missing.ok).toBe(false)
    const built = buildVisit({
      name: ' New ',
      area: 'Leith',
      notes: 'Batch',
      date: '2026-08-30',
      pin: { lat: 55.9, lng: -3.1 },
      photo,
    })
    expect(built.ok).toBe(true)
    if (!built.ok) return
    const updated = upsertVisit([built.visit], { ...built.visit, notes: 'Edited' })
    expect(updated).toHaveLength(1)
    expect(updated[0].notes).toBe('Edited')
    expect(upsertVisit(updated, { ...built.visit, id: 'v-2', name: 'Other' })).toHaveLength(2)
  })
})
