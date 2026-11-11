import { describe, expect, it } from 'vitest'
import { contrastRatio, tokens } from './tokens'

describe('colour tokens', () => {
  it('keeps text on the ceramic ground at least 4.5:1', () => {
    expect(contrastRatio(tokens.label, tokens.bg)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(tokens.text, tokens.bg)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(tokens.muted, tokens.bg)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(tokens.creamText, tokens.cream)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(tokens.creamText, tokens.chipOn)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(tokens.text, tokens.surface)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(tokens.label, tokens.surface)).toBeGreaterThanOrEqual(4.5)
  })
})
