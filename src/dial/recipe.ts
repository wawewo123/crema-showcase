import type { Grinder } from './catalog'

export type Method = 'espresso' | 'v60' | 'aeropress' | 'cold-brew'
export type Roast = 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark'
export type Process = 'washed' | 'natural' | 'honey' | 'anaerobic' | 'other'

export type RoastGroup = 'light' | 'medium' | 'dark'

export function roastGroup(roast: Roast): RoastGroup {
  if (roast === 'light' || roast === 'medium-light') return 'light'
  if (roast === 'medium-dark' || roast === 'dark') return 'dark'
  return 'medium'
}

export function daysOffRoast(roastDate: string, todayIso: string): number {
  const a = Date.parse(`${roastDate.slice(0, 10)}T00:00:00Z`)
  const b = Date.parse(`${todayIso.slice(0, 10)}T00:00:00Z`)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0
  return Math.max(0, Math.round((b - a) / 86_400_000))
}

export type Stage = {
  id: string
  label: string
  durationS: number | null
  targetG: number | null
  cue: string
}

export type Recipe = {
  method: Method
  doseG: number
  waterG: number
  yieldG: number
  tempC: number
  grind: string
  fresh: boolean
  stages: Stage[]
}

type GrinderHint = Pick<Grinder, 'espressoRange' | 'filterRange' | 'espressoSuitable' | 'filterSuitable'> | null

function grindText(method: Method, group: RoastGroup, grinder: GrinderHint): string {
  if (method === 'espresso' && grinder?.espressoSuitable === false) {
    return 'The maker says this grinder is not for espresso.'
  }
  const range = method === 'espresso' ? grinder?.espressoRange : grinder?.filterRange
  if (range) {
    if (group === 'light') return `Start at the fine end of the published range (${range}).`
    if (group === 'dark') return `Start at the coarse end of the published range (${range}).`
    return `Start in the published range (${range}).`
  }
  if (method === 'espresso') {
    if (group === 'light') return 'Start finer than a medium espresso grind.'
    if (group === 'dark') return 'Start coarser than a medium espresso grind.'
    return 'Start at a medium espresso grind.'
  }
  if (method === 'cold-brew') return 'Start coarse, like a French press.'
  if (group === 'light') return 'Start a little finer than a medium filter grind.'
  if (group === 'dark') return 'Start a little coarser than a medium filter grind.'
  return 'Start at a medium filter grind.'
}

export function startingRecipe(input: { method: Method; roast: Roast; days: number; grinder: GrinderHint }): Recipe {
  const group = roastGroup(input.roast)
  const fresh = input.days < 8
  const grind = grindText(input.method, group, input.grinder)
  if (input.method === 'espresso') {
    const doseG = 18
    const yieldG = group === 'light' ? 45 : group === 'dark' ? 32 : 36
    const tempC = group === 'light' ? 96 : group === 'dark' ? 90 : 93
    return {
      method: 'espresso',
      doseG,
      waterG: yieldG,
      yieldG,
      tempC,
      grind,
      fresh,
      stages: [{ id: 'shot', label: 'Shot', durationS: null, targetG: yieldG, cue: `Stop the shot and weigh the yield. Aim near ${yieldG} g.` }],
    }
  }
  if (input.method === 'v60') {
    const doseG = 15
    const waterG = group === 'light' ? 270 : group === 'dark' ? 225 : 250
    const tempC = group === 'light' ? 96 : group === 'dark' ? 90 : 93
    const bloomS = fresh ? 45 : 30
    const mid = Math.round(waterG * 0.6)
    return {
      method: 'v60',
      doseG,
      waterG,
      yieldG: waterG,
      tempC,
      grind,
      fresh,
      stages: [
        { id: 'bloom', label: 'Bloom', durationS: bloomS, targetG: doseG * 2, cue: `Pour ${doseG * 2} g and wait.` },
        { id: 'pour-1', label: 'First pour', durationS: 30, targetG: mid, cue: `Pour to ${mid} g.` },
        { id: 'pour-2', label: 'Second pour', durationS: 30, targetG: waterG, cue: `Pour to ${waterG} g.` },
        { id: 'drawdown', label: 'Drawdown', durationS: null, targetG: waterG, cue: 'Let the bed finish. Tap done when the drip slows.' },
      ],
    }
  }
  if (input.method === 'aeropress') {
    const doseG = 15
    const waterG = 200
    const tempC = group === 'light' ? 94 : group === 'dark' ? 85 : 90
    const steep = group === 'light' ? 105 : group === 'dark' ? 75 : 90
    const stages: Stage[] = []
    if (fresh) stages.push({ id: 'bloom', label: 'Bloom', durationS: 20, targetG: 30, cue: 'Pour 30 g and wait. These beans are very fresh.' })
    stages.push(
      { id: 'steep', label: 'Steep', durationS: steep, targetG: waterG, cue: `Top up to ${waterG} g and steep.` },
      { id: 'press', label: 'Press', durationS: 30, targetG: waterG, cue: 'Press gently for about 30 seconds.' },
    )
    return { method: 'aeropress', doseG, waterG, yieldG: waterG, tempC, grind, fresh, stages }
  }
  const doseG = 80
  const waterG = 800
  const hours = group === 'light' ? 18 : group === 'dark' ? 14 : 16
  return {
    method: 'cold-brew',
    doseG,
    waterG,
    yieldG: waterG,
    tempC: 20,
    grind,
    fresh,
    stages: [
      {
        id: 'steep',
        label: 'Steep',
        durationS: hours * 3600,
        targetG: waterG,
        cue: `${doseG} g coffee and ${waterG} g water. Reopen Crema to read the clock. A phone may suspend this page; the time is taken from when you pressed start.`,
      },
    ],
  }
}
