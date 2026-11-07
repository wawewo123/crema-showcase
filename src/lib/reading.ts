import { flow, ratio, styleLabel, type Shot } from './brew'

/** Settled values for the single polite live region. */
export function reading(s: Shot): string {
  const r = ratio(s)
  const fl = flow(s)
  return `Yield ${s.y} grams, time ${s.t} seconds. Ratio 1 to ${r.toFixed(1)}. Flow ${fl.toFixed(1)} grams per second, simulated. Style ${styleLabel(r)}.`
}
