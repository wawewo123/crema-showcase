import { describe, expect, it } from 'vitest'
import { validateBean, validateGrinder, validateMachine } from './validate'

const machine = {
  brand: 'Home',
  model: 'Custom',
  heating: 'single-boiler',
  pid: null,
  brewBar: 9,
  pumpBar: null,
  portafilterMm: 58,
  preInfusion: null,
  flowControl: null,
}

describe('kit validation', () => {
  it('rejects pressure and portafilter sizes outside the published ranges', () => {
    expect(validateMachine({ ...machine, brewBar: 30 }).ok).toBe(false)
    expect(validateMachine({ ...machine, portafilterMm: 40 }).ok).toBe(false)
    expect(validateMachine(machine).ok).toBe(true)
  })

  it('rejects a step count on a stepless grinder and an oversized burr', () => {
    expect(validateGrinder({ brand: 'A', model: 'B', burrType: 'conical', burrSizeMm: 200, adjustment: 'stepless', steps: 10, espressoRange: null, filterRange: null }).ok).toBe(false)
    expect(validateGrinder({ brand: 'A', model: 'B', burrType: 'flat', burrSizeMm: 64, adjustment: 'stepped', steps: 40, espressoRange: '1–20', filterRange: null }).ok).toBe(true)
  })

  it('requires a roast date on a bean', () => {
    expect(validateBean({ name: 'Decaf', roaster: 'Square Mile', origin: 'Blend', notes: '', roastDate: 'yesterday' }).ok).toBe(false)
    expect(validateBean({ name: 'Decaf', roaster: 'Square Mile', origin: 'Blend', notes: '', roastDate: '2026-11-01' }).ok).toBe(true)
  })
})
