import { describe, expect, it } from 'vitest'
import type { Machine } from './catalog'
import { keepFillable, presentField, presentMachine } from './overrides'

const gaggia = {
  id: 'gaggia-classic-pro-e24',
  brand: 'Gaggia',
  model: 'Classic Pro E24',
  category: 'home',
  heating: 'single-boiler',
  pid: null,
  brewBar: 9,
  pumpBar: 15,
  portafilterMm: 58,
  preInfusion: null,
  flowControl: null,
  sourceUrl: 'https://example.com',
  sourceTitle: 'Example',
} satisfies Machine

describe('spec overrides', () => {
  it('labels a published value as sourced and ignores a conflicting override', () => {
    expect(presentField(9, 8)).toEqual({ value: 9, origin: 'sourced' })
    expect(presentField(null, 9)).toEqual({ value: 9, origin: 'yours' })
    expect(presentField(null, undefined)).toEqual({ value: null, origin: 'unknown' })
  })

  it('lets the user fill only blank Gaggia fields', () => {
    const shown = presentMachine(gaggia, { pid: false, brewBar: 8 })
    expect(shown.brewBar).toEqual({ value: 9, origin: 'sourced' })
    expect(shown.pid).toEqual({ value: false, origin: 'yours' })
    expect(shown.flowControl.origin).toBe('unknown')
    expect(keepFillable(gaggia, { pid: false, brewBar: 8 }, ['pid', 'brewBar'])).toEqual({ pid: false })
  })

})
