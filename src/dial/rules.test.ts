import { describe, expect, it } from 'vitest'
import { startingRecipe } from './recipe'
import { suggest } from './rules'

const espresso = startingRecipe({ method: 'espresso', roast: 'medium', days: 14, grinder: null })

describe('one suggestion', () => {
  it('tells a stepped grinder to move two steps when a sour shot ran fast', () => {
    const result = suggest({ method: 'espresso', recipe: espresso, shotTimeS: 18, taste: { sourBitter: 1, weakStrong: 2 }, adjustment: 'stepped' })
    expect(result.change).toBe('Grind 2 steps finer.')
    expect(result.ruleId).toBe('espresso-fast-sour')
  })

  it('does not invent steps for a stepless grinder', () => {
    const result = suggest({ method: 'espresso', recipe: espresso, shotTimeS: 18, taste: { sourBitter: 1, weakStrong: 3 }, adjustment: 'stepless' })
    expect(result.change).toBe('Grind a small turn finer.')
  })

  it('raises yield when the sour shot was not fast', () => {
    const result = suggest({ method: 'espresso', recipe: espresso, shotTimeS: 28, taste: { sourBitter: 2, weakStrong: 3 }, adjustment: 'stepped' })
    expect(result.change).toBe('Increase yield to 40 g.')
  })

  it('leaves a balanced cup alone', () => {
    const result = suggest({ method: 'espresso', recipe: espresso, shotTimeS: 28, taste: { sourBitter: 3, weakStrong: 3 }, adjustment: null })
    expect(result.ruleId).toBe('keeper')
  })

  it('cools a bitter V60 by 2 degrees', () => {
    const v60 = startingRecipe({ method: 'v60', roast: 'medium', days: 14, grinder: null })
    const result = suggest({ method: 'v60', recipe: v60, shotTimeS: null, taste: { sourBitter: 5, weakStrong: 3 }, adjustment: null })
    expect(result.change).toBe('Drop temperature to 91°C.')
  })
})
