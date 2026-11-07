import { describe, expect, it } from 'vitest'
import { clusterVisits } from './cluster'
import type { Visit } from './types'

function visit(id: string, lat: number, lng: number): Visit {
  return { id, name: id, area: '', notes: '', date: '2026-10-01', lat, lng }
}

describe('clusters', () => {
  it('groups nearby visits at a country zoom and keeps the selected pin single', () => {
    const a = visit('a', 51.55, -0.06)
    const b = visit('b', 51.56, -0.07)
    const d = visit('d', 51.54, -0.05)
    const c = visit('c', 55.95, -3.18)
    const pins = clusterVisits([a, b, d, c], 6, 'a')
    const cluster = pins.find((p) => p.kind === 'cluster')
    const selected = pins.find((p) => p.kind === 'visit' && p.visit.id === 'a')
    expect(selected).toBeTruthy()
    expect(cluster && cluster.kind === 'cluster' ? cluster.visits.map((v) => v.id).sort() : []).toEqual(['b', 'd'])
    expect(pins.some((p) => p.kind === 'visit' && p.visit.id === 'c')).toBe(true)
  })

  it('clusters two close visits when neither is selected', () => {
    const pins = clusterVisits([visit('a', 51.55, -0.06), visit('b', 51.56, -0.07)], 6, null)
    expect(pins).toHaveLength(1)
    expect(pins[0].kind).toBe('cluster')
    if (pins[0].kind === 'cluster') expect(pins[0].visits).toHaveLength(2)
  })
})
