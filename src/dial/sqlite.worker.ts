import sqlite3InitModule from '@sqlite.org/sqlite-wasm'
import schemaSql from '../../db/schema.sql?raw'
import machineSql from '../../db/seed/machines.sql?raw'
import grinderSql from '../../db/seed/grinders.sql?raw'
import { applyScripts, importLegacyOnce, readDial, readGrinders, readMachines, replaceUserData, type Sql } from './sql'
import type { DialState } from './state'

type SqliteDb = {
  exec(sql: string): void
  pointer: number
}

type Request =
  | { id: number; op: 'init'; legacy: string | null; snapshot: Uint8Array | null }
  | { id: number; op: 'load' }
  | { id: number; op: 'catalog' }
  | { id: number; op: 'save'; state: DialState }

let db: Sql & { raw: SqliteDb } | null = null
let mode: 'opfs' | 'idb' = 'idb'
let sqlite3: Awaited<ReturnType<typeof sqlite3InitModule>> | null = null

function wrap(raw: SqliteDb): Sql & { raw: SqliteDb } {
  const execBind = raw as unknown as {
    exec(options: { sql: string; bind?: unknown[]; rowMode?: string; callback?: (row: unknown) => void } | string): void
  }
  return {
    raw,
    exec(sql) {
      execBind.exec(sql)
    },
    run(sql, params = []) {
      execBind.exec({ sql, bind: params })
    },
    all<T>(sql: string, params: unknown[] = []) {
      const rows: T[] = []
      execBind.exec({
        sql,
        bind: params,
        rowMode: 'object',
        callback: (row) => {
          rows.push(row as T)
        },
      })
      return rows
    },
  }
}

function openMemory(snapshot: Uint8Array | null) {
  if (!sqlite3) throw new Error('SQLite is not ready')
  const raw = new sqlite3.oo1.DB(':memory:') as unknown as SqliteDb
  const wrapped = wrap(raw)
  if (snapshot && snapshot.byteLength > 0) {
    const ptr = sqlite3.wasm.allocFromTypedArray(snapshot)
    const flags = sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE | sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE
    const rc = sqlite3.capi.sqlite3_deserialize(raw.pointer, 'main', ptr, snapshot.byteLength, snapshot.byteLength, flags)
    if (rc !== 0) throw new Error(`SQLite could not open the saved database (${rc})`)
  }
  return wrapped
}

async function openDb(snapshot: Uint8Array | null) {
  if (!sqlite3) sqlite3 = await sqlite3InitModule()
  const secure = typeof self !== 'undefined' && self.isSecureContext
  if (secure && typeof sqlite3.installOpfsSAHPoolVfs === 'function') {
    try {
      const pool = await sqlite3.installOpfsSAHPoolVfs({ name: 'opfs-sahpool' })
      const raw = new pool.OpfsSAHPoolDb('crema.sqlite3') as unknown as SqliteDb
      mode = 'opfs'
      return wrap(raw)
    } catch {
      mode = 'idb'
    }
  }
  mode = 'idb'
  return openMemory(snapshot)
}

function persist() {
  if (mode !== 'idb' || !db || !sqlite3) return
  const bytes = sqlite3.capi.sqlite3_js_db_export(db.raw.pointer)
  self.postMessage({ op: 'snapshot', bytes }, { transfer: [bytes.buffer] })
}

self.onmessage = async (event: MessageEvent<Request>) => {
  const message = event.data
  try {
    if (message.op === 'init') {
      db = await openDb(message.snapshot)
      let needsSchema = true
      try {
        const ready = db.all<{ n: number }>('SELECT COUNT(*) AS n FROM schema_migrations')
        needsSchema = !ready.length || ready[0].n === 0
      } catch {
        needsSchema = true
      }
      if (needsSchema) applyScripts(db, [schemaSql, machineSql, grinderSql])
      const legacy = message.legacy ? (JSON.parse(message.legacy) as DialState) : null
      importLegacyOnce(db, legacy && Array.isArray(legacy.beans) ? legacy : null)
      persist()
      self.postMessage({ id: message.id, ok: true, mode })
      return
    }
    if (!db) throw new Error('Database is not open')
    if (message.op === 'load') {
      self.postMessage({ id: message.id, ok: true, dial: readDial(db) })
      return
    }
    if (message.op === 'catalog') {
      self.postMessage({ id: message.id, ok: true, machines: readMachines(db), grinders: readGrinders(db) })
      return
    }
    replaceUserData(db, message.state)
    persist()
    self.postMessage({ id: message.id, ok: true })
  } catch (error) {
    self.postMessage({ id: message.id, ok: false, error: error instanceof Error ? error.message : 'SQLite failed' })
  }
}
