import { describe, expect, it } from 'vitest'
import { cremaLightness, pourFill, shouldRunCupLoop } from './policy'

const live = { active: true, visible: true, reduced: false, canvas: true, hidden: false }

describe('cup loop policy', () => {
  it('runs only while the brew cup is on a visible canvas', () => {
    expect(shouldRunCupLoop(live)).toBe(true)
    expect(shouldRunCupLoop({ ...live, reduced: true })).toBe(false)
    expect(shouldRunCupLoop({ ...live, active: false })).toBe(false)
    expect(shouldRunCupLoop({ ...live, visible: false })).toBe(false)
    expect(shouldRunCupLoop({ ...live, hidden: true })).toBe(false)
    expect(shouldRunCupLoop({ ...live, canvas: false })).toBe(false)
  })

  it('eases the pour from empty to full', () => {
    expect(pourFill(0)).toBe(0)
    expect(pourFill(700)).toBeGreaterThan(0.5)
    expect(pourFill(1400)).toBe(1)
    expect(pourFill(4000)).toBe(1)
  })

  it('nudges crema lightness only a little across the yield range', () => {
    const low = cremaLightness(15)
    const high = cremaLightness(70)
    expect(high - low).toBeLessThan(0.2)
    expect(low).toBeGreaterThan(0.9)
    expect(high).toBeLessThan(1.1)
  })
})
