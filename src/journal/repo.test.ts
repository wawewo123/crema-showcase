import { describe, expect, it } from 'vitest'
import { createRepo, type BlobStore } from './repo'
import { BACKUP_KEY, STORAGE_KEY } from './types'

function memStorage(): Storage {
  const map = new Map<string, string>()
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => {
      map.set(k, String(v))
    },
    removeItem: (k) => {
      map.delete(k)
    },
    clear: () => map.clear(),
    key: (i) => [...map.keys()][i] ?? null,
    get length() {
      return map.size
    },
  }
}

function memoryBlobs(): BlobStore & { map: Map<string, string> } {
  const map = new Map<string, string>()
  return {
    map,
    async get(k) {
      return map.has(k) ? map.get(k)! : null
    },
    async set(k, v) {
      map.set(k, v)
    },
    async del(k) {
      map.delete(k)
    },
  }
}

const v1 = {
  version: 1,
  showDemos: true,
  entries: [
    {
      id: 'v-1',
      name: 'Mine',
      area: 'Leith',
      notes: 'Batch',
      date: '2026-08-30',
      lat: 55.9,
      lng: -3.1,
      photo: 'data:image/jpeg;base64,aaaa',
      demo: true,
    },
  ],
}

describe('journal repo', () => {
  it('promotes a version 1 localStorage journal into the blob store and strips the photo from the mirror', async () => {
    const mirror = memStorage()
    mirror.setItem(STORAGE_KEY, JSON.stringify(v1))
    const blobs = memoryBlobs()
    const state = await createRepo(blobs, mirror).load()
    expect(state.entries[0].name).toBe('Mine')
    expect(state.entries[0].demo).toBe(false)
    expect(state.entries[0].photo).toContain('jpeg')
    expect(blobs.map.get('journal')).toContain('Mine')
    const slim = JSON.parse(mirror.getItem(STORAGE_KEY)!)
    expect(slim.kind).toBe('mirror')
    expect(slim.entries[0].photo).toBeUndefined()
  })

  it('keeps a full copy in localStorage when the blob store is unavailable', async () => {
    const mirror = memStorage()
    const blobs: BlobStore = {
      async get() {
        throw new Error('no idb')
      },
      async set() {
        throw new Error('no idb')
      },
      async del() {
        throw new Error('no idb')
      },
    }
    const repo = createRepo(blobs, mirror)
    const saved = await repo.save({
      version: 2,
      showDemos: true,
      entries: [
        {
          id: 'v-9',
          name: 'Kept',
          area: '',
          notes: '',
          date: '2026-10-01',
          lat: 1,
          lng: 2,
          photo: 'data:image/jpeg;base64,bbbb',
        },
      ],
    })
    expect(saved.ok).toBe(true)
    const loaded = await repo.load()
    expect(loaded.entries[0].photo).toContain('bbbb')
  })

  it('backs up unreadable data and then clears the journal', async () => {
    const mirror = memStorage()
    mirror.setItem(STORAGE_KEY, '{')
    const blobs = memoryBlobs()
    const repo = createRepo(blobs, mirror)
    const loaded = await repo.load()
    expect(loaded.entries).toEqual([])
    expect(mirror.getItem(BACKUP_KEY)).toBe('{')
    mirror.setItem(STORAGE_KEY, JSON.stringify({ version: 2, kind: 'mirror', showDemos: true, entries: [] }))
    await repo.clear()
    expect(mirror.getItem(STORAGE_KEY)).toBeNull()
  })
})
