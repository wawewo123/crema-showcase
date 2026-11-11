import type { GrinderOverride, MachineOverride } from './overrides'
import type { Method, Process, Recipe, Roast } from './recipe'
import type { Taste } from './rules'

export type CustomMachine = {
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

export type CustomGrinder = {
  brand: string
  model: string
  burrType: string | null
  burrSizeMm: number | null
  adjustment: 'stepped' | 'stepless' | null
  steps: number | null
  espressoRange: string | null
  filterRange: string | null
}

export type Setup = {
  id: string
  name: string
  machineId: string | null
  grinderId: string | null
  customMachine: CustomMachine | null
  customGrinder: CustomGrinder | null
}

export type Bean = {
  id: string
  name: string
  roaster: string
  origin: string
  process: Process
  roast: Roast
  roastDate: string
  notes: string
}

export type SavedBrew = {
  id: string
  at: string
  method: Method
  beanId: string
  setupId: string
  recipe: Recipe
  elapsedMs: number
  yieldG: number | null
  taste: Taste | null
  suggestion: string | null
}

export type DialState = {
  version: 1
  setups: Setup[]
  activeSetupId: string | null
  overrides: { machines: Record<string, MachineOverride>; grinders: Record<string, GrinderOverride> }
  beans: Bean[]
  brews: SavedBrew[]
}

export function emptyDial(): DialState {
  return { version: 1, setups: [], activeSetupId: null, overrides: { machines: {}, grinders: {} }, beans: [], brews: [] }
}
