import SqliteWorker from './sqlite.worker.ts?worker&inline'
import type { Grinder, Machine } from './catalog'
import type { DialState } from './state'

type SqliteCtor = new () => Worker

const SqliteWorkerCtor = SqliteWorker as unknown as SqliteCtor

type Response =
  | { id: number; ok: true; mode?: string; dial?: DialState; machines?: Machine[]; grinders?: Grinder[] }
  | { id: number; ok: false; error: string }

const pending = new Map<number, { resolve: (value: Response) => void; reject: (error: Error) => void }>()
let worker: Worker | null = null
let seq = 0
let opening: Promise<string> | null = null

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('crema', 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains('kv')) req.result.createObjectStore('kv')
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB failed'))
  })
}

async function idbGet(key: string): Promise<unknown> {
  const db = await idb()
  return new Promise((resolve, reject) => {
    const req = db.transaction('kv', 'readonly').objectStore('kv').get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(key: string, value: unknown) {
  const db = await idb()
  return new Promise<void>((resolve, reject) => {
    const req = db.transaction('kv', 'readwrite').objectStore('kv').put(value, key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

function call(body: Record<string, unknown>): Promise<Response> {
  if (!worker) throw new Error('SQLite worker is not open')
  const id = ++seq
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    worker!.postMessage({ id, ...body })
  })
}

export async function openSqlite() {
  if (opening) return opening
  opening = (async () => {
    worker = new SqliteWorkerCtor()
    worker.onmessage = (event: MessageEvent<Response & { op?: string; bytes?: Uint8Array }>) => {
      if (event.data.op === 'snapshot' && event.data.bytes) {
        idbSet('sqlite-snapshot', event.data.bytes).catch(() => undefined)
        return
      }
      const waiter = pending.get(event.data.id)
      if (!waiter) return
      pending.delete(event.data.id)
      if (event.data.ok) waiter.resolve(event.data)
      else waiter.reject(new Error(event.data.error))
    }
    const legacy = await idbGet('dial').catch(() => null)
    const snapshot = await idbGet('sqlite-snapshot').catch(() => null)
    const response = await call({
      op: 'init',
      legacy: typeof legacy === 'string' ? legacy : null,
      snapshot: snapshot instanceof Uint8Array ? snapshot : null,
    })
    if (!response.ok) throw new Error(response.error)
    return response.mode ?? 'idb'
  })()
  return opening
}

export async function loadDial(): Promise<DialState> {
  await openSqlite()
  const response = await call({ op: 'load' })
  if (!response.ok) throw new Error(response.error)
  if (!response.dial) throw new Error('Dial data did not load')
  return response.dial
}

export async function loadCatalog(): Promise<{ machines: Machine[]; grinders: Grinder[] }> {
  await openSqlite()
  const response = await call({ op: 'catalog' })
  if (!response.ok) throw new Error(response.error)
  return { machines: response.machines ?? [], grinders: response.grinders ?? [] }
}

export async function saveDial(state: DialState): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    await openSqlite()
    await call({ op: 'save', state })
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : 'SQLite could not save this brew.' }
  }
}
