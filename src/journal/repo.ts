import { emptyState, migrateRaw } from './migrate'
import { BACKUP_KEY, STORAGE_KEY, type JournalState, type Visit } from './types'

export type BlobStore = {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  del(key: string): Promise<void>
}

export type SaveResult = { ok: true } | { ok: false; reason: string }

export type JournalRepo = {
  load(): Promise<JournalState>
  save(state: JournalState): Promise<SaveResult>
  clear(): Promise<void>
}

const IDB_KEY = 'journal'

function withoutMedia(entries: Visit[]) {
  return entries
    .filter((e) => !e.demo)
    .map((e) => ({
      id: e.id,
      name: e.name,
      area: e.area,
      notes: e.notes,
      date: e.date,
      lat: e.lat,
      lng: e.lng,
    }))
}

function fullDocument(state: JournalState) {
  return JSON.stringify({
    version: 2,
    kind: 'full',
    showDemos: state.showDemos,
    entries: state.entries.filter((e) => !e.demo),
  })
}

function quotaMessage(err: unknown) {
  const quota = err instanceof DOMException && /quota/i.test(err.name + err.message)
  return quota
    ? 'Browser storage is full — try a smaller photo or delete an older visit.'
    : 'This browser blocked local storage, so the visit will only last until you close the tab.'
}

export function createRepo(blobs: BlobStore, mirror: Storage): JournalRepo {
  const writeMirror = (state: JournalState) => {
    mirror.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        kind: 'mirror',
        showDemos: state.showDemos,
        entries: withoutMedia(state.entries),
      }),
    )
  }

  return {
    async load() {
      let blobRaw: string | null = null
      try {
        blobRaw = await blobs.get(IDB_KEY)
      } catch {
        blobRaw = null
      }
      if (blobRaw) {
        try {
          const migrated = migrateRaw(JSON.parse(blobRaw))
          if (migrated.ok && migrated.kind !== 'mirror') return migrated.state
        } catch {
          /* try the mirror next */
        }
      }
      const lsRaw = mirror.getItem(STORAGE_KEY)
      if (!lsRaw) return emptyState()
      let parsed: unknown
      try {
        parsed = JSON.parse(lsRaw)
      } catch {
        try {
          mirror.setItem(BACKUP_KEY, lsRaw)
        } catch {
          /* ignore */
        }
        return emptyState()
      }
      const migrated = migrateRaw(parsed)
      if (!migrated.ok) {
        try {
          mirror.setItem(BACKUP_KEY, lsRaw)
          mirror.removeItem(STORAGE_KEY)
        } catch {
          /* ignore */
        }
        return emptyState()
      }
      if (migrated.kind === 'mirror') return migrated.state
      try {
        await blobs.set(IDB_KEY, fullDocument(migrated.state))
        writeMirror(migrated.state)
      } catch {
        try {
          mirror.setItem(STORAGE_KEY, fullDocument(migrated.state))
        } catch {
          /* the in-memory state is still returned */
        }
      }
      return migrated.state
    },

    async save(state) {
      try {
        await blobs.set(IDB_KEY, fullDocument(state))
        try {
          writeMirror(state)
        } catch {
          /* names are also inside IndexedDB */
        }
        return { ok: true }
      } catch (blobErr) {
        try {
          mirror.setItem(STORAGE_KEY, fullDocument(state))
          return { ok: true }
        } catch (mirrorErr) {
          return { ok: false, reason: quotaMessage(mirrorErr ?? blobErr) }
        }
      }
    },

    async clear() {
      try {
        await blobs.del(IDB_KEY)
      } catch {
        /* ignore */
      }
      try {
        mirror.removeItem(STORAGE_KEY)
      } catch {
        /* ignore */
      }
    },
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('crema', 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv')
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbRequest<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction('kv', mode)
        const req = run(tx.objectStore('kv'))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }),
  )
}

export function idbBlobStore(): BlobStore {
  return {
    get(key) {
      return idbRequest<string | undefined>('readonly', (store) => store.get(key)).then((v) => v ?? null)
    },
    set(key, value) {
      return idbRequest('readwrite', (store) => store.put(value, key)).then(() => undefined)
    },
    del(key) {
      return idbRequest('readwrite', (store) => store.delete(key)).then(() => undefined)
    },
  }
}

export function browserRepo(): JournalRepo {
  return createRepo(idbBlobStore(), localStorage)
}
