import type { Grinder, Machine } from './catalog'

export type Origin = 'sourced' | 'yours' | 'unknown'

export type Shown<T> = { value: T | null; origin: Origin }

type SpecValue = string | number | boolean | null

export function presentField<T extends SpecValue>(source: T, override: T | undefined): Shown<T> {
  if (source != null) return { value: source, origin: 'sourced' }
  if (override != null) return { value: override, origin: 'yours' }
  return { value: null, origin: 'unknown' }
}

const MACHINE_KEYS = ['heating', 'pid', 'brewBar', 'pumpBar', 'portafilterMm', 'preInfusion', 'flowControl'] as const
const GRINDER_KEYS = ['burrType', 'burrSizeMm', 'adjustment', 'steps', 'espressoRange', 'filterRange', 'espressoSuitable', 'filterSuitable'] as const

export type MachineKey = (typeof MACHINE_KEYS)[number]
export type GrinderKey = (typeof GRINDER_KEYS)[number]
export type MachineOverride = Partial<Pick<Machine, MachineKey>>
export type GrinderOverride = Partial<Pick<Grinder, GrinderKey>>

export function presentMachine(source: Machine, override: MachineOverride | undefined) {
  const out = {} as Record<MachineKey, Shown<Machine[MachineKey]>>
  for (const key of MACHINE_KEYS) out[key] = presentField(source[key], override?.[key])
  return out
}

export function presentGrinder(source: Grinder, override: GrinderOverride | undefined) {
  const out = {} as Record<GrinderKey, Shown<Grinder[GrinderKey]>>
  for (const key of GRINDER_KEYS) out[key] = presentField(source[key], override?.[key])
  return out
}

/** Drop any override that would replace a sourced value. */
export function keepFillable(source: Machine | Grinder, override: Record<string, unknown>, keys: readonly string[]) {
  const next: Record<string, unknown> = {}
  for (const key of keys) {
    const value = override[key]
    if (value == null) continue
    if (source[key as keyof typeof source] != null) continue
    next[key] = value
  }
  return next
}

export { MACHINE_KEYS, GRINDER_KEYS }
