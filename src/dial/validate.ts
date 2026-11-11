export const LIMITS = {
  name: 60,
  notes: 500,
  pressure: [1, 20] as const,
  portafilter: [49, 60] as const,
  burr: [30, 120] as const,
  steps: [2, 400] as const,
  preInfusion: 80,
}

export function cleanText(value: string, max: number): string | null {
  const t = value.trim()
  if (!t || t.length > max) return null
  return t
}

export function cleanOptionalText(value: string, max: number): string | null | 'invalid' {
  const t = value.trim()
  if (!t) return null
  if (t.length > max) return 'invalid'
  return t
}

export function inRange(n: number, min: number, max: number) {
  return Number.isFinite(n) && n >= min && n <= max
}

export type MachineInput = {
  brand: string
  model: string
  heating: string | null
  pid: boolean | null
  brewBar: number | null
  pumpBar: number | null
  portafilterMm: number | null
  preInfusion: string | null
  flowControl: boolean | null
}

export type GrinderInput = {
  brand: string
  model: string
  burrType: string | null
  burrSizeMm: number | null
  adjustment: string | null
  steps: number | null
  espressoRange: string | null
  filterRange: string | null
}

const HEATING = new Set(['single-boiler', 'heat-exchanger', 'dual-boiler', 'thermocoil', 'thermoblock'])
const BURR = new Set(['conical', 'flat'])
const ADJUST = new Set(['stepped', 'stepless'])

export function validateMachine(input: MachineInput): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = []
  if (!cleanText(input.brand, LIMITS.name)) errors.push('Brand must be 1–60 characters.')
  if (!cleanText(input.model, LIMITS.name)) errors.push('Model must be 1–60 characters.')
  if (input.heating != null && !HEATING.has(input.heating)) errors.push('Heating type is not a known value.')
  if (input.brewBar != null && !inRange(input.brewBar, ...LIMITS.pressure)) errors.push('Brew pressure must be 1–20 bar.')
  if (input.pumpBar != null && !inRange(input.pumpBar, ...LIMITS.pressure)) errors.push('Pump pressure must be 1–20 bar.')
  if (input.portafilterMm != null && !inRange(input.portafilterMm, ...LIMITS.portafilter)) errors.push('Portafilter size must be 49–60 mm.')
  if (input.preInfusion != null && input.preInfusion.trim().length > LIMITS.preInfusion) errors.push('Pre-infusion text must be 80 characters or fewer.')
  return errors.length ? { ok: false, errors } : { ok: true }
}

export function validateGrinder(input: GrinderInput): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = []
  if (!cleanText(input.brand, LIMITS.name)) errors.push('Brand must be 1–60 characters.')
  if (!cleanText(input.model, LIMITS.name)) errors.push('Model must be 1–60 characters.')
  if (input.burrType != null && !BURR.has(input.burrType)) errors.push('Burr type must be conical or flat.')
  if (input.burrSizeMm != null && !inRange(input.burrSizeMm, ...LIMITS.burr)) errors.push('Burr size must be 30–120 mm.')
  if (input.adjustment != null && !ADJUST.has(input.adjustment)) errors.push('Adjustment must be stepped or stepless.')
  if (input.adjustment === 'stepless' && input.steps != null) errors.push('A stepless grinder has no step count.')
  if (input.steps != null && !inRange(input.steps, ...LIMITS.steps)) errors.push('Step count must be 2–400.')
  if (input.espressoRange != null && input.espressoRange.trim().length > LIMITS.preInfusion) errors.push('Espresso range text is too long.')
  if (input.filterRange != null && input.filterRange.trim().length > LIMITS.preInfusion) errors.push('Filter range text is too long.')
  return errors.length ? { ok: false, errors } : { ok: true }
}

export function validateBean(input: { name: string; roaster: string; origin: string; notes: string; roastDate: string }): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = []
  if (!cleanText(input.name, LIMITS.name)) errors.push('Bean name must be 1–60 characters.')
  if (!cleanText(input.roaster, LIMITS.name)) errors.push('Roaster must be 1–60 characters.')
  if (!cleanText(input.origin, LIMITS.name)) errors.push('Origin must be 1–60 characters.')
  if (input.notes.trim().length > LIMITS.notes) errors.push('Notes must be 500 characters or fewer.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.roastDate)) errors.push('Roast date must be YYYY-MM-DD.')
  return errors.length ? { ok: false, errors } : { ok: true }
}
