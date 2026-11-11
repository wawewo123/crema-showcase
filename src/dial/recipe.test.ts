import { describe, expect, it } from 'vitest'
import { daysOffRoast, startingRecipe } from './recipe'

describe('starting recipes', () => {
  it('makes a light espresso longer and hotter', () => {
    const recipe = startingRecipe({ method: 'espresso', roast: 'light', days: 20, grinder: null })
    expect(recipe.yieldG).toBe(45)
    expect(recipe.tempC).toBe(96)
    expect(recipe.grind).toContain('finer')
  })

  it('uses a published espresso range instead of inventing clicks', () => {
    const recipe = startingRecipe({
      method: 'espresso',
      roast: 'medium',
      days: 14,
      grinder: { espressoRange: '1–20', filterRange: '21–40', espressoSuitable: true, filterSuitable: true },
    })
    expect(recipe.grind).toContain('1–20')
  })

  it('lengthens a fresh V60 bloom to 45 seconds', () => {
    const fresh = startingRecipe({ method: 'v60', roast: 'medium', days: 3, grinder: null })
    const rested = startingRecipe({ method: 'v60', roast: 'medium', days: 21, grinder: null })
    expect(fresh.stages[0]).toMatchObject({ id: 'bloom', durationS: 45 })
    expect(rested.stages[0].durationS).toBe(30)
    expect(daysOffRoast('2026-11-01', '2026-11-11')).toBe(10)
  })

  it('says when the maker ruled out espresso', () => {
    const recipe = startingRecipe({
      method: 'espresso',
      roast: 'medium',
      days: 14,
      grinder: { espressoRange: null, filterRange: 'filter', espressoSuitable: false, filterSuitable: true },
    })
    expect(recipe.grind).toContain('not for espresso')
  })
})
