import type { Visit } from './types'

export type Pin =
  | { kind: 'visit'; visit: Visit }
  | { kind: 'cluster'; id: string; lat: number; lng: number; visits: Visit[] }

/** Groups visits that would overlap at this zoom. The selected visit always stays its own pin. */
export function clusterVisits(visits: Visit[], zoom: number, selectedId: string | null): Pin[] {
  const z = Math.max(0, Math.min(18, zoom))
  const deg = (32 * 360) / (256 * 2 ** z)
  const groups = new Map<string, Visit[]>()
  const out: Pin[] = []
  for (const v of visits) {
    if (v.id === selectedId) {
      out.push({ kind: 'visit', visit: v })
      continue
    }
    const key = `${Math.floor(v.lng / deg)}:${Math.floor(v.lat / deg)}`
    const arr = groups.get(key)
    if (arr) arr.push(v)
    else groups.set(key, [v])
  }
  for (const [key, members] of groups) {
    if (members.length === 1) out.push({ kind: 'visit', visit: members[0] })
    else {
      const lat = members.reduce((s, v) => s + v.lat, 0) / members.length
      const lng = members.reduce((s, v) => s + v.lng, 0) / members.length
      out.push({ kind: 'cluster', id: `c-${key}`, lat, lng, visits: members })
    }
  }
  return out
}
