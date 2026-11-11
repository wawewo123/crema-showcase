import { emptyDial, type DialState } from './state'

const KEY = 'dial'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('crema', 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains('kv')) req.result.createObjectStore('kv')
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB failed'))
  })
}

async function idbGet(): Promise<string | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction('kv', 'readonly').objectStore('kv').get(KEY)
    req.onsuccess = () => resolve((req.result as string | undefined) ?? null)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(value: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction('kv', 'readwrite').objectStore('kv').put(value, KEY)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function loadDial(): Promise<DialState> {
  try {
    const raw = await idbGet()
    if (!raw) return emptyDial()
    const data = JSON.parse(raw) as DialState
    if (!data || data.version !== 1 || !Array.isArray(data.beans)) return emptyDial()
    return data
  } catch {
    return emptyDial()
  }
}

export async function saveDial(state: DialState): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    await idbSet(JSON.stringify(state))
    return { ok: true }
  } catch {
    return { ok: false, reason: 'This browser blocked local storage, so the dial-in log stays until you close the tab.' }
  }
}
