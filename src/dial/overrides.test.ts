import { describe, expect, it } from 'vitest'
import { MACHINES, GRINDERS } from './catalog'
import { keepFillable, presentField, presentMachine } from './overrides'

describe('spec overrides', () => {
  it('labels a published value as sourced and ignores a conflicting override', () => {
    expect(presentField(9, 8)).toEqual({ value: 9, origin: 'sourced' })
    expect(presentField(null, 9)).toEqual({ value: 9, origin: 'yours' })
    expect(presentField(null, undefined)).toEqual({ value: null, origin: 'unknown' })
  })

  it('lets the user fill only blank Gaggia fields', () => {
    const gaggia = MACHINES.find((m) => m.id === 'gaggia-classic-pro-e24')!
    const shown = presentMachine(gaggia, { pid: false, brewBar: 8 })
    expect(shown.brewBar).toEqual({ value: 9, origin: 'sourced' })
    expect(shown.pid).toEqual({ value: false, origin: 'yours' })
    expect(shown.flowControl.origin).toBe('unknown')
    expect(keepFillable(gaggia, { pid: false, brewBar: 8 }, ['pid', 'brewBar'])).toEqual({ pid: false })
  })

  it('does not invent an espresso range for the Niche Zero', () => {
    const niche = GRINDERS.find((g) => g.id === 'niche-zero')!
    expect(niche.espressoRange).toBeNull()
    expect(niche.sourceUrl.startsWith('https://')).toBe(true)
  })
})
