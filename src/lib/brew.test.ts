import { describe, expect, it } from 'vitest'
import { PRESETS, chartGeom, flow, preInf, styleLabel, verdict } from './brew'
import { reading } from './reading'

describe('brew maths', () => {
  it('keeps the four presets', () => {
    expect(PRESETS.map((p) => [p.id, p.d, p.y, p.t])).toEqual([
      ['classic', 18, 36, 28],
      ['ristretto', 18, 24, 24],
      ['turbo', 18, 45, 15],
      ['lungo', 17, 51, 34],
    ])
  })

  it('computes classic flow after a 6s pre-infusion', () => {
    expect(preInf(28)).toBe(6)
    expect(flow({ d: 18, y: 36, t: 28 })).toBeCloseTo(36 / 22, 5)
    expect(styleLabel(2)).toBe('Normale')
    expect(styleLabel(1.2)).toBe('Ristretto')
    expect(styleLabel(3)).toBe('Lungo')
  })

  it('uses the existing verdict sentences', () => {
    expect(verdict({ d: 18, y: 45, t: 15 })).toEqual([
      'Fast & long',
      'Turbo-style shots run quick by design. Taste for clarity vs. thinness.',
    ])
    expect(verdict({ d: 18, y: 36, t: 18 })[0]).toBe('Running quick')
    expect(verdict({ d: 18, y: 36, t: 40 })[0]).toBe('Running slow')
    expect(verdict({ d: 18, y: 36, t: 28 })[0]).toBe('In a typical window')
  })

  it('holds yield at 0 through pre-infusion and at the full yield at the end', () => {
    const s = { d: 18, y: 36, t: 28 }
    const g = chartGeom(s)
    expect(g.yieldAt(0)).toBe(0)
    expect(g.yieldAt(g.pi)).toBe(0)
    expect(g.yieldAt(s.t)).toBe(36)
    expect(g.yieldPath.length).toBeGreaterThan(10)
  })

  it('reads the classic shot in one sentence', () => {
    expect(reading({ d: 18, y: 36, t: 28 })).toContain('Yield 36 grams')
    expect(reading({ d: 18, y: 36, t: 28 })).toContain('simulated')
    expect(reading({ d: 18, y: 36, t: 28 })).toContain('Normale')
  })
})
