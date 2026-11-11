// @vitest-environment node
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import { importLegacyOnce, readDial } from '../src/dial/sql.ts'
import { emptyDial } from '../src/dial/state.ts'

function open() {
  const db = new DatabaseSync(':memory:')
  const root = new URL('../', import.meta.url)
  db.exec('PRAGMA foreign_keys = ON;')
  db.exec(readFileSync(new URL('db/schema.sql', root), 'utf8'))
  db.exec(readFileSync(new URL('db/seed/machines.sql', root), 'utf8'))
  db.exec(readFileSync(new URL('db/seed/grinders.sql', root), 'utf8'))
  return {
    raw: db,
    exec(sql) {
      db.exec(sql)
    },
    run(sql, params = []) {
      db.prepare(sql).run(...params)
    },
    all(sql, params = []) {
      return db.prepare(sql).all(...params)
    },
  }
}

describe('sqlite schema', () => {
  it('seeds sourced machines and grinders and records migration 1', () => {
    const db = open()
    expect(db.all('SELECT COUNT(*) AS n FROM machines')[0].n).toBe(7)
    expect(db.all("SELECT espresso_range FROM grinders WHERE id = 'niche-zero'")[0].espresso_range).toBeNull()
    expect(db.all('SELECT version FROM schema_migrations').map((row) => row.version)).toEqual([1])
    db.raw.close()
  })

  it('rejects a brew pressure outside 1–20 bar', () => {
    const db = open()
    expect(() => db.run("UPDATE machines SET brew_bar = 30 WHERE id = 'gaggia-classic-pro-e24'")).toThrow()
    db.raw.close()
  })

  it('rejects an override of a sourced field and keeps a blank fill', () => {
    const db = open()
    expect(() => db.run("INSERT INTO machine_overrides (machine_id, field, value_text) VALUES ('sage-bes875', 'pid', '0')")).toThrow(/sourced/)
    db.run("INSERT INTO machine_overrides (machine_id, field, value_text) VALUES ('gaggia-classic-pro-e24', 'pid', '0')")
    expect(db.all("SELECT value_text FROM machine_overrides WHERE machine_id = 'gaggia-classic-pro-e24'")[0].value_text).toBe('0')
    db.raw.close()
  })

  it('imports an old dial document once', () => {
    const db = open()
    const legacy = emptyDial()
    legacy.setups = [{ id: 'home', name: 'Home', machineId: 'gaggia-classic-pro-e24', grinderId: 'baratza-encore-esp', customMachine: null, customGrinder: null }]
    legacy.activeSetupId = 'home'
    legacy.overrides.machines['gaggia-classic-pro-e24'] = { pid: false }
    legacy.beans = [{ id: 'b1', name: 'Red Brick', roaster: 'Square Mile', origin: 'Blend', process: 'washed', roast: 'medium', roastDate: '2026-11-01', notes: '' }]
    expect(importLegacyOnce(db, legacy)).toBe(true)
    expect(importLegacyOnce(db, legacy)).toBe(false)
    const dial = readDial(db)
    expect(dial.activeSetupId).toBe('home')
    expect(dial.overrides.machines['gaggia-classic-pro-e24']?.pid).toBe(false)
    expect(dial.beans[0].name).toBe('Red Brick')
    db.raw.close()
  })
})
