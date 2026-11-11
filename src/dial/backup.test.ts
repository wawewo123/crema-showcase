import { describe, expect, it } from 'vitest'
import type { JournalState } from '../journal/types'
import { exportAll, validateBackup } from './backup'
import { emptyDial } from './state'

const journal: JournalState = {
  version: 2,
  showDemos: true,
  entries: [{ id: 'v-1', name: 'Corner', area: 'Leith', notes: '', date: '2026-10-02', lat: 55.9, lng: -3.1 }],
}

describe('combined backup', () => {
  it('keeps a version 2 journal import from deleting dial data', () => {
    const old = { version: 2, showDemos: true, entries: journal.entries }
    const result = validateBackup(old, JSON.stringify(old).length)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.journal?.entries).toHaveLength(1)
    expect(result.dial).toBeNull()
  })

  it('round-trips an override with the journal', () => {
    const dial = emptyDial()
    dial.overrides.machines['gaggia-classic-pro-e24'] = { pid: false }
    dial.beans.push({ id: 'b1', name: 'Red Brick', roaster: 'Square Mile', origin: 'Blend', process: 'washed', roast: 'medium', roastDate: '2026-11-01', notes: '' })
    const json = exportAll(journal, dial, '2026-11-11T00:00:00.000Z')
    const back = validateBackup(JSON.parse(json), json.length)
    expect(back.ok).toBe(true)
    if (!back.ok || !back.dial) return
    expect(back.dial.overrides.machines['gaggia-classic-pro-e24']?.pid).toBe(false)
    expect(back.dial.beans[0].name).toBe('Red Brick')
    expect(back.journal?.entries[0].name).toBe('Corner')
  })
})
