import { describe, expect, it } from 'vitest'
import { filterByMonth, monthTicks } from './months'
import type { Visit } from './types'

const visits: Visit[] = [
  { id: 'a', name: 'A', area: '', notes: '', date: '2026-10-24', lat: 1, lng: 1 },
  { id: 'b', name: 'B', area: '', notes: '', date: '2026-08-02', lat: 2, lng: 2 },
]

describe('month timeline', () => {
  it('starts with All and only lists months that exist', () => {
    expect(monthTicks(visits).map((t) => t.label)).toEqual(['All', 'Aug', 'Oct'])
    expect(filterByMonth(visits, 'all')).toHaveLength(2)
    expect(filterByMonth(visits, '2026-10').map((v) => v.id)).toEqual(['a'])
  })
})
