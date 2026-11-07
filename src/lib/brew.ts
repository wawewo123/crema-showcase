// Brew maths ported 1:1 from Crema v1 (showcases/coffee-workflow/index.html).
// This is NOT an extraction model: the curve is a smooth illustrative shape.

export type Shot = { d: number; y: number; t: number }
export type Preset = Shot & { id: string; name: string; blurb: string }

export const PRESETS: Preset[] = [
  { id: 'classic', name: 'Classic 1:2', d: 18, y: 36, t: 28, blurb: 'The everyday bar baseline' },
  { id: 'ristretto', name: 'Ristretto', d: 18, y: 24, t: 24, blurb: 'Short, dense, syrupy' },
  { id: 'turbo', name: 'Turbo shot', d: 18, y: 45, t: 15, blurb: 'Fast and long by design' },
  { id: 'lungo', name: 'Lungo', d: 17, y: 51, t: 34, blurb: 'Long pull, lighter body' },
]

export const LIMITS = {
  d: { min: 14, max: 24, step: 0.1, unit: 'g', label: 'Dose in', aria: 'Dose in grams' },
  y: { min: 15, max: 70, step: 0.5, unit: 'g', label: 'Yield out', aria: 'Yield in grams' },
  t: { min: 10, max: 45, step: 1, unit: 's', label: 'Shot time', aria: 'Shot time in seconds' },
} as const

export const CHECKLIST = ['Purge group & dry basket', 'Dose and distribute', 'Tamp level', 'Lock in, start timer']

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export const ratio = (s: Shot) => s.y / s.d
export const preInf = (t: number) => Math.min(6, t * 0.22)
/** v1: average g/s after a short pre-infusion */
export const flow = (s: Shot) => s.y / Math.max(1, s.t - preInf(s.t))
export const styleLabel = (r: number) => (r < 1.5 ? 'Ristretto' : r <= 2.5 ? 'Normale' : 'Lungo')

export function verdict(s: Shot): [string, string] {
  const r = s.y / s.d
  const t = s.t
  if (t < 20 && r >= 2.2) return ['Fast & long', 'Turbo-style shots run quick by design. Taste for clarity vs. thinness.']
  if (t < 22) return ['Running quick', 'A common bar habit: try a slightly finer grind, then re-taste.']
  if (t > 32) return ['Running slow', 'A common bar habit: try slightly coarser, or a lower dose, then re-taste.']
  return ['In a typical window', 'Numbers look conventional. Your palate is the real judge.']
}

export const CHART = { W: 640, H: 300, L: 46, R: 16, T: 16, B: 40 }

export type ChartGeom = {
  pi: number
  Tm: number
  Ym: number
  x: (t: number) => number
  y: (g: number) => number
  yieldPath: string
  areaPath: string
  flowPath: string
  yTicks: number[]
  xTicks: number[]
  /** yield in cup at time t (same formula as v1) */
  yieldAt: (t: number) => number
}

export function chartGeom(s: Shot): ChartGeom {
  const { W, H, L, R, T, B } = CHART
  const pi = preInf(s.t)
  const Tm = Math.max(45, s.t + 5)
  const Ym = Math.max(40, Math.ceil((s.y * 1.15) / 10) * 10)
  const x = (t: number) => L + (t / Tm) * (W - L - R)
  const y = (g: number) => H - B - (g / Ym) * (H - T - B)
  const yy = (t: number) => {
    if (t <= pi) return 0
    if (t >= s.t) return s.y
    const u = (t - pi) / (s.t - pi)
    return s.y * (u * u * (3 - 2 * u) * 0.6 + u * 0.4)
  }
  const fl = (t: number) => {
    const a = Math.max(0, t - 0.4)
    const b = Math.min(s.t, t + 0.4)
    return t > s.t ? 0 : (yy(b) - yy(a)) / (b - a || 1)
  }
  let fm = 0
  for (let t = 0; t <= s.t; t += 0.25) fm = Math.max(fm, fl(t))
  const fs = (Ym * 0.55) / (fm || 1)
  let p = ''
  let q = ''
  for (let t = 0; t <= s.t; t += 0.25) {
    p += (p ? 'L' : 'M') + x(t).toFixed(1) + ',' + y(yy(t)).toFixed(1)
    q += (q ? 'L' : 'M') + x(t).toFixed(1) + ',' + y(fl(t) * fs).toFixed(1)
  }
  // close exactly at the end point
  p += `L${x(s.t).toFixed(1)},${y(s.y).toFixed(1)}`
  const area = p + `L${x(s.t)},${y(0)}L${x(0)},${y(0)}Z`
  const yTicks: number[] = []
  for (let v = 0; v <= Ym; v += 10) yTicks.push(v)
  const xTicks: number[] = []
  for (let t = 0; t <= Tm; t += 5) xTicks.push(t)
  return { pi, Tm, Ym, x, y, yieldPath: p, areaPath: area, flowPath: q, yTicks, xTicks, yieldAt: yy }
}

export const fmt = (n: number, dp = 1) => (Math.round(n * 10 ** dp) / 10 ** dp).toString()
