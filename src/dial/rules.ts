import type { Adjustment } from './catalog'
import type { Method, Recipe } from './recipe'

export type Taste = { sourBitter: number; weakStrong: number; notes: string }

export type Suggestion = { ruleId: string; change: string; reason: string }

function grindPhrase(direction: 'finer' | 'coarser', adjustment: Adjustment | null): string {
  if (adjustment === 'stepped') return direction === 'finer' ? 'Grind 2 steps finer.' : 'Grind 2 steps coarser.'
  if (adjustment === 'stepless') return direction === 'finer' ? 'Grind a small turn finer.' : 'Grind a small turn coarser.'
  return direction === 'finer' ? 'Grind finer.' : 'Grind coarser.'
}

const KEEPER: Suggestion = { ruleId: 'keeper', change: 'No change. Log this as a keeper.', reason: 'Both scales sit in the middle.' }

/**
 * One change only. Sour/bitter is judged before strength, so a cup that is
 * both sour and weak gets an extraction change rather than two edits.
 */
export function suggest(input: {
  method: Method
  recipe: Recipe
  shotTimeS: number | null
  taste: Pick<Taste, 'sourBitter' | 'weakStrong'>
  adjustment: Adjustment | null
}): Suggestion {
  const sour = input.taste.sourBitter <= 2
  const bitter = input.taste.sourBitter >= 4
  const weak = input.taste.weakStrong <= 2
  const strong = input.taste.weakStrong >= 4
  const { recipe, method } = input

  if (method === 'espresso') {
    if (sour && input.shotTimeS != null && input.shotTimeS < 25) {
      return { ruleId: 'espresso-fast-sour', change: grindPhrase('finer', input.adjustment), reason: 'A fast sour shot is usually under-extracted because the grind is coarse.' }
    }
    if (sour) {
      const next = Math.min(55, recipe.yieldG + 4)
      return { ruleId: 'espresso-sour-yield', change: `Increase yield to ${next} g.`, reason: 'The shot was not fast, so more water is the single next extraction change.' }
    }
    if (bitter && input.shotTimeS != null && input.shotTimeS > 35) {
      return { ruleId: 'espresso-slow-bitter', change: grindPhrase('coarser', input.adjustment), reason: 'A slow bitter shot is usually over-extracted because the grind is fine.' }
    }
    if (bitter) {
      const next = Math.max(86, recipe.tempC - 2)
      return { ruleId: 'espresso-bitter-temp', change: `Drop temperature to ${next}°C.`, reason: 'Bitterness with a normal shot time often eases when the brew water is cooler.' }
    }
    if (weak) {
      const next = Math.min(22, Math.round((recipe.doseG + 0.5) * 10) / 10)
      return { ruleId: 'espresso-weak-dose', change: `Increase dose to ${next} g.`, reason: 'A weak but not sour cup needs more coffee, not a second extraction change.' }
    }
    if (strong) {
      const next = Math.max(14, Math.round((recipe.doseG - 0.5) * 10) / 10)
      return { ruleId: 'espresso-strong-dose', change: `Decrease dose to ${next} g.`, reason: 'A strong but not bitter cup is often simply a larger dose than you wanted.' }
    }
    return KEEPER
  }

  if (method === 'v60') {
    if (sour) return { ruleId: 'v60-sour-grind', change: grindPhrase('finer', input.adjustment), reason: 'Pour-over sourness is most often a coarse grind.' }
    if (bitter) {
      const next = Math.max(85, recipe.tempC - 2)
      return { ruleId: 'v60-bitter-temp', change: `Drop temperature to ${next}°C.`, reason: 'Bitter pour-over often calms down with slightly cooler water.' }
    }
    if (weak) return { ruleId: 'v60-weak-dose', change: `Increase dose to ${recipe.doseG + 1} g.`, reason: 'A weak cup needs a little more coffee before the pour weights change.' }
    if (strong) return { ruleId: 'v60-strong-water', change: `Increase water to ${recipe.waterG + 20} g.`, reason: 'A strong cup opens up with a slightly longer ratio.' }
    return KEEPER
  }

  if (method === 'aeropress') {
    if (sour) return { ruleId: 'aero-sour-steep', change: 'Steep 15 seconds longer.', reason: 'A sour AeroPress usually wants more contact time.' }
    if (bitter) {
      const next = Math.max(80, recipe.tempC - 2)
      return { ruleId: 'aero-bitter-temp', change: `Drop temperature to ${next}°C.`, reason: 'Bitter immersion often eases with cooler water.' }
    }
    if (weak) return { ruleId: 'aero-weak-dose', change: `Increase dose to ${recipe.doseG + 1} g.`, reason: 'A weak cup needs a little more coffee.' }
    if (strong) return { ruleId: 'aero-strong-water', change: `Increase water to ${recipe.waterG + 20} g.`, reason: 'A strong cup opens up with more water.' }
    return KEEPER
  }

  const hours = Math.round((recipe.stages[0]?.durationS ?? 16 * 3600) / 3600)
  if (sour) {
    const next = Math.min(24, hours + 2)
    return { ruleId: 'cold-sour-time', change: `Steep for ${next} hours.`, reason: 'A sour cold brew usually wants more time, up to about a day.' }
  }
  if (bitter) {
    const next = Math.max(8, hours - 2)
    return { ruleId: 'cold-bitter-time', change: `Steep for ${next} hours.`, reason: 'A bitter cold brew has usually sat too long.' }
  }
  if (weak) return { ruleId: 'cold-weak-dose', change: `Increase dose to ${recipe.doseG + 10} g.`, reason: 'A weak cold brew needs more coffee in the same water.' }
  if (strong) return { ruleId: 'cold-strong-dilute', change: 'Dilute the finished brew with 100 g water.', reason: 'A strong cold brew is a concentrate. Dilute it rather than changing two brew variables.' }
  return KEEPER
}
