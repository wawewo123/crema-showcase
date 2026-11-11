import { describe, expect, it } from 'vitest'
import { bestForBean, type BrewRecord } from './history'

function brew(id: string, at: string, sour: number, strong: number): BrewRecord {
  return { id, at, method: 'espresso', beanId: 'bean', setupId: 's', recipeDoseG: 18, recipeYieldG: 36, recipeTempC: 93, taste: { sourBitter: sour, weakStrong: strong, notes: '' } }
}

describe('best brew for a bag', () => {
  it('prefers the balanced cup, then the newer one', () => {
    const older = brew('a', '2026-11-01T10:00:00Z', 3, 3)
    const newer = brew('b', '2026-11-02T10:00:00Z', 3, 3)
    const sour = brew('c', '2026-11-03T10:00:00Z', 1, 3)
    expect(bestForBean([sour, older, newer], 'bean')?.id).toBe('b')
  })
})
