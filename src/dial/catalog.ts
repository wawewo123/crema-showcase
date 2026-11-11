/** Catalog row types. The rows themselves live in db/seed/*.sql. */

export type Category = 'home' | 'prosumer' | 'commercial'
export type Heating = 'single-boiler' | 'heat-exchanger' | 'dual-boiler' | 'thermocoil' | 'thermoblock'
export type BurrType = 'conical' | 'flat'
export type Adjustment = 'stepped' | 'stepless'

export type Machine = {
  id: string
  brand: string
  model: string
  category: Category
  heating: Heating | null
  pid: boolean | null
  brewBar: number | null
  pumpBar: number | null
  portafilterMm: number | null
  preInfusion: string | null
  flowControl: boolean | null
  sourceUrl: string
  sourceTitle: string
}

export type Grinder = {
  id: string
  brand: string
  model: string
  category: Category
  burrType: BurrType | null
  burrSizeMm: number | null
  adjustment: Adjustment | null
  steps: number | null
  espressoRange: string | null
  filterRange: string | null
  espressoSuitable: boolean | null
  filterSuitable: boolean | null
  sourceUrl: string
  sourceTitle: string
}
