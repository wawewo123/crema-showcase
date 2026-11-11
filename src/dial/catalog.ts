/** Sourced starter catalog. A null field is not stated by the source. Do not guess it. */

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

export const MACHINES: Machine[] = [
  {
    id: 'gaggia-classic-pro-e24',
    brand: 'Gaggia',
    model: 'Classic Pro E24',
    category: 'home',
    heating: 'single-boiler',
    pid: null,
    brewBar: 9,
    pumpBar: 15,
    portafilterMm: 58,
    preInfusion: null,
    flowControl: null,
    sourceUrl: 'https://www.gaggia-na.com/products/gaggia-classic-pro',
    sourceTitle: 'Gaggia North America, Classic Pro E24 specifications',
  },
  {
    id: 'sage-bes875',
    brand: 'Sage',
    model: 'Barista Express BES875',
    category: 'home',
    heating: 'thermocoil',
    pid: true,
    brewBar: 9,
    pumpBar: 15,
    portafilterMm: 54,
    preInfusion: 'Low pressure pre-infusion',
    flowControl: null,
    sourceUrl: 'https://www.sageappliances.com/en-gb/product/bes875',
    sourceTitle: 'Sage GB, Barista Express product page',
  },
  {
    id: 'rancilio-silvia',
    brand: 'Rancilio',
    model: 'Silvia',
    category: 'home',
    heating: 'single-boiler',
    pid: false,
    brewBar: null,
    pumpBar: null,
    portafilterMm: null,
    preInfusion: null,
    flowControl: null,
    sourceUrl: 'https://www.ranciliogroup.com/rancilio/silvia/silvia/',
    sourceTitle: 'Rancilio Group, Silvia technical specifications',
  },
  {
    id: 'rancilio-silvia-pro-x',
    brand: 'Rancilio',
    model: 'Silvia Pro X',
    category: 'prosumer',
    heating: 'dual-boiler',
    pid: true,
    brewBar: null,
    pumpBar: null,
    portafilterMm: null,
    preInfusion: 'Soft infusion',
    flowControl: null,
    sourceUrl: 'https://www.ranciliogroup.com/rancilio/silvia-pro-x/silvia-pro-x/',
    sourceTitle: 'Rancilio Group, Silvia Pro X technical specifications',
  },
  {
    id: 'profitec-go-2',
    brand: 'Profitec',
    model: 'GO 2.0',
    category: 'home',
    heating: 'single-boiler',
    pid: true,
    brewBar: null,
    pumpBar: null,
    portafilterMm: null,
    preInfusion: 'Selectable preinfusion',
    flowControl: null,
    sourceUrl: 'https://www.profitec-espresso.com/en/products/go-2-0',
    sourceTitle: 'Profitec, GO 2.0 technical data',
  },
  {
    id: 'lelit-bianca-pl162t',
    brand: 'Lelit',
    model: 'Bianca PL162T',
    category: 'prosumer',
    heating: 'dual-boiler',
    pid: true,
    brewBar: null,
    pumpBar: null,
    portafilterMm: 58,
    preInfusion: 'Programmable pre-infusion',
    flowControl: true,
    sourceUrl: 'https://www.lelit.com/wp-content/uploads/2024/09/EN-Bianca.pdf',
    sourceTitle: 'Lelit, Bianca PL162T product sheet',
  },
  {
    id: 'lm-linea-micra',
    brand: 'La Marzocco',
    model: 'Linea Micra',
    category: 'prosumer',
    heating: 'dual-boiler',
    pid: true,
    brewBar: null,
    pumpBar: null,
    portafilterMm: null,
    preInfusion: null,
    flowControl: null,
    sourceUrl: 'https://www.lamarzocco.com/uk/en/wp-content/uploads/2023/04/product_brochure_linea_micra_eng.pdf',
    sourceTitle: 'La Marzocco UK, Linea Micra brochure',
  },
]

export const GRINDERS: Grinder[] = [
  {
    id: 'niche-zero',
    brand: 'Niche',
    model: 'Zero',
    category: 'home',
    burrType: 'conical',
    burrSizeMm: 63,
    adjustment: 'stepless',
    steps: null,
    espressoRange: null,
    filterRange: null,
    espressoSuitable: true,
    filterSuitable: true,
    sourceUrl: 'https://www.nichecoffee.co.uk/products/niche-zero',
    sourceTitle: 'Niche Coffee, Zero tech specs',
  },
  {
    id: 'fellow-ode-gen-2',
    brand: 'Fellow',
    model: 'Ode Gen 2',
    category: 'home',
    burrType: 'flat',
    burrSizeMm: 64,
    adjustment: 'stepped',
    steps: 31,
    espressoRange: null,
    filterRange: 'Pour-over, drip, AeroPress, French press, cold brew',
    espressoSuitable: false,
    filterSuitable: true,
    sourceUrl: 'https://fellowproducts.com/products/ode-brew-grinder-gen-2',
    sourceTitle: 'Fellow, Ode Brew Grinder Gen 2 details',
  },
  {
    id: 'baratza-encore-esp',
    brand: 'Baratza',
    model: 'Encore ESP',
    category: 'home',
    burrType: 'conical',
    burrSizeMm: 40,
    adjustment: 'stepped',
    steps: 40,
    espressoRange: '1–20',
    filterRange: '21–40',
    espressoSuitable: true,
    filterSuitable: true,
    sourceUrl: 'https://www.baratza.com/en-gb/product/encoretm-esp-zcg495',
    sourceTitle: 'Baratza GB, Encore ESP specifications',
  },
  {
    id: 'mahlkonig-ek43',
    brand: 'Mahlkönig',
    model: 'EK43',
    category: 'commercial',
    burrType: 'flat',
    burrSizeMm: 98,
    adjustment: 'stepless',
    steps: null,
    espressoRange: null,
    filterRange: null,
    espressoSuitable: true,
    filterSuitable: true,
    sourceUrl: 'https://www.mahlkoenig.us/products/ek43',
    sourceTitle: 'Mahlkönig USA, EK43 specifications',
  },
  {
    id: 'sage-bes875-grinder',
    brand: 'Sage',
    model: 'Barista Express built-in grinder',
    category: 'home',
    burrType: 'conical',
    burrSizeMm: null,
    adjustment: null,
    steps: null,
    espressoRange: null,
    filterRange: null,
    espressoSuitable: true,
    filterSuitable: null,
    sourceUrl: 'https://assets.sageappliances.com/BES875/SES875_EU_UG6_D21_FA_LR.pdf',
    sourceTitle: 'Sage, Barista Express user guide (integrated conical burr grinder)',
  },
]

export const machineById = (id: string) => MACHINES.find((m) => m.id === id) ?? null
export const grinderById = (id: string) => GRINDERS.find((g) => g.id === id) ?? null
