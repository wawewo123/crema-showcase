import type { Taste } from './rules'

export type BrewRecord = {
  id: string
  at: string
  method: string
  beanId: string
  setupId: string
  recipeDoseG: number
  recipeYieldG: number
  recipeTempC: number
  taste: Taste | null
}

/** Higher is closer to balanced. A missing taste cannot win. */
export function tasteScore(taste: Pick<Taste, 'sourBitter' | 'weakStrong'>): number {
  return 6 - Math.abs(taste.sourBitter - 3) - Math.abs(taste.weakStrong - 3)
}

export function bestForBean(brews: BrewRecord[], beanId: string): BrewRecord | null {
  const mine = brews.filter((b) => b.beanId === beanId && b.taste)
  if (!mine.length) return null
  return [...mine].sort((a, b) => {
    const score = tasteScore(b.taste!) - tasteScore(a.taste!)
    if (score !== 0) return score
    return b.at.localeCompare(a.at)
  })[0]
}
