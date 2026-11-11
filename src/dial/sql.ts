import type { Grinder, Machine } from './catalog'
import type { GrinderOverride, MachineOverride } from './overrides'
import type { Recipe } from './recipe'
import type { DialState, SavedBrew, Setup } from './state'

export type Sql = {
  exec(sql: string): void
  run(sql: string, params?: unknown[]): void
  all<T>(sql: string, params?: unknown[]): T[]
}

const bit = (value: boolean | null | undefined) => (value == null ? null : value ? 1 : 0)
const bool = (value: unknown): boolean | null => (value == null ? null : Number(value) === 1)

export function applyScripts(db: Sql, scripts: string[]) {
  db.exec('PRAGMA foreign_keys = ON;')
  for (const script of scripts) db.exec(script)
}

function textValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? '1' : '0'
  return String(value)
}

function parseOverride(field: string, text: string): string | number | boolean {
  if (field === 'pid' || field === 'flow_control' || field === 'flowControl' || field === 'espresso_suitable' || field === 'filter_suitable' || field === 'espressoSuitable' || field === 'filterSuitable') {
    return text === '1'
  }
  if (field === 'brew_bar' || field === 'pump_bar' || field === 'burr_size_mm' || field === 'steps' || field === 'portafilter_mm') {
    return Number(text)
  }
  return text
}

const MACHINE_TO_SQL: Record<string, string> = {
  heating: 'heating',
  pid: 'pid',
  brewBar: 'brew_bar',
  pumpBar: 'pump_bar',
  portafilterMm: 'portafilter_mm',
  preInfusion: 'pre_infusion',
  flowControl: 'flow_control',
}

const GRINDER_TO_SQL: Record<string, string> = {
  burrType: 'burr_type',
  burrSizeMm: 'burr_size_mm',
  adjustment: 'adjustment',
  steps: 'steps',
  espressoRange: 'espresso_range',
  filterRange: 'filter_range',
  espressoSuitable: 'espresso_suitable',
  filterSuitable: 'filter_suitable',
}

const SQL_TO_MACHINE: Record<string, keyof MachineOverride> = {
  heating: 'heating',
  pid: 'pid',
  brew_bar: 'brewBar',
  pump_bar: 'pumpBar',
  portafilter_mm: 'portafilterMm',
  pre_infusion: 'preInfusion',
  flow_control: 'flowControl',
}

const SQL_TO_GRINDER: Record<string, keyof GrinderOverride> = {
  burr_type: 'burrType',
  burr_size_mm: 'burrSizeMm',
  adjustment: 'adjustment',
  steps: 'steps',
  espresso_range: 'espressoRange',
  filter_range: 'filterRange',
  espresso_suitable: 'espressoSuitable',
  filter_suitable: 'filterSuitable',
}

type MachineRow = {
  id: string
  brand: string
  model: string
  category: Machine['category']
  heating: Machine['heating']
  pid: number | null
  brew_bar: number | null
  pump_bar: number | null
  portafilter_mm: number | null
  pre_infusion: string | null
  flow_control: number | null
  source_url: string
  source_title: string
}

type GrinderRow = {
  id: string
  brand: string
  model: string
  category: Grinder['category']
  burr_type: Grinder['burrType']
  burr_size_mm: number | null
  adjustment: Grinder['adjustment']
  steps: number | null
  espresso_range: string | null
  filter_range: string | null
  espresso_suitable: number | null
  filter_suitable: number | null
  source_url: string
  source_title: string
}

export function readMachines(db: Sql): Machine[] {
  return db.all<MachineRow>('SELECT * FROM machines ORDER BY brand, model').map((row) => ({
    id: row.id,
    brand: row.brand,
    model: row.model,
    category: row.category,
    heating: row.heating,
    pid: bool(row.pid),
    brewBar: row.brew_bar,
    pumpBar: row.pump_bar,
    portafilterMm: row.portafilter_mm,
    preInfusion: row.pre_infusion,
    flowControl: bool(row.flow_control),
    sourceUrl: row.source_url,
    sourceTitle: row.source_title,
  }))
}

export function readGrinders(db: Sql): Grinder[] {
  return db.all<GrinderRow>('SELECT * FROM grinders ORDER BY brand, model').map((row) => ({
    id: row.id,
    brand: row.brand,
    model: row.model,
    category: row.category,
    burrType: row.burr_type,
    burrSizeMm: row.burr_size_mm,
    adjustment: row.adjustment,
    steps: row.steps,
    espressoRange: row.espresso_range,
    filterRange: row.filter_range,
    espressoSuitable: bool(row.espresso_suitable),
    filterSuitable: bool(row.filter_suitable),
    sourceUrl: row.source_url,
    sourceTitle: row.source_title,
  }))
}

export function replaceUserData(db: Sql, state: DialState) {
  db.exec('BEGIN')
  try {
    db.exec('DELETE FROM brews')
    db.exec('DELETE FROM beans')
    db.exec('DELETE FROM machine_overrides')
    db.exec('DELETE FROM grinder_overrides')
    db.exec('DELETE FROM setups')
    for (const setup of state.setups) insertSetup(db, setup, setup.id === state.activeSetupId)
    for (const [machineId, override] of Object.entries(state.overrides.machines)) insertMachineOverride(db, machineId, override)
    for (const [grinderId, override] of Object.entries(state.overrides.grinders)) insertGrinderOverride(db, grinderId, override)
    for (const bean of state.beans) {
      db.run(
        `INSERT INTO beans (id, name, roaster, origin, process, roast, roast_date, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [bean.id, bean.name, bean.roaster, bean.origin, bean.process, bean.roast, bean.roastDate, bean.notes],
      )
    }
    for (const brew of state.brews) insertBrew(db, brew)
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

function insertSetup(db: Sql, setup: Setup, active: boolean) {
  const machine = setup.customMachine
  const grinder = setup.customGrinder
  db.run(
    `INSERT INTO setups (
      id, name, active, machine_id, grinder_id,
      custom_machine_brand, custom_machine_model, custom_machine_heating, custom_machine_pid,
      custom_machine_brew_bar, custom_machine_pump_bar, custom_machine_portafilter_mm,
      custom_machine_pre_infusion, custom_machine_flow_control,
      custom_grinder_brand, custom_grinder_model, custom_grinder_burr_type, custom_grinder_burr_mm,
      custom_grinder_adjustment, custom_grinder_steps, custom_grinder_espresso_range, custom_grinder_filter_range
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      setup.id,
      setup.name,
      active ? 1 : 0,
      setup.machineId,
      setup.grinderId,
      machine?.brand ?? null,
      machine?.model ?? null,
      machine?.heating ?? null,
      bit(machine?.pid),
      machine?.brewBar ?? null,
      machine?.pumpBar ?? null,
      machine?.portafilterMm ?? null,
      machine?.preInfusion ?? null,
      bit(machine?.flowControl),
      grinder?.brand ?? null,
      grinder?.model ?? null,
      grinder?.burrType ?? null,
      grinder?.burrSizeMm ?? null,
      grinder?.adjustment ?? null,
      grinder?.steps ?? null,
      grinder?.espressoRange ?? null,
      grinder?.filterRange ?? null,
    ],
  )
}

function insertMachineOverride(db: Sql, machineId: string, override: MachineOverride) {
  for (const [key, value] of Object.entries(override)) {
    if (value == null) continue
    const field = MACHINE_TO_SQL[key]
    if (!field) continue
    db.run('INSERT INTO machine_overrides (machine_id, field, value_text) VALUES (?, ?, ?)', [machineId, field, textValue(value)])
  }
}

function insertGrinderOverride(db: Sql, grinderId: string, override: GrinderOverride) {
  for (const [key, value] of Object.entries(override)) {
    if (value == null) continue
    const field = GRINDER_TO_SQL[key]
    if (!field) continue
    db.run('INSERT INTO grinder_overrides (grinder_id, field, value_text) VALUES (?, ?, ?)', [grinderId, field, textValue(value)])
  }
}

function insertBrew(db: Sql, brew: SavedBrew) {
  db.run(
    `INSERT INTO brews (
      id, at, method, bean_id, setup_id, dose_g, water_g, yield_g, temp_c, grind, fresh, stages_json,
      elapsed_ms, actual_yield_g, sour_bitter, weak_strong, taste_notes, suggestion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      brew.id,
      brew.at,
      brew.method,
      brew.beanId,
      brew.setupId,
      brew.recipe.doseG,
      brew.recipe.waterG,
      brew.recipe.yieldG,
      brew.recipe.tempC,
      brew.recipe.grind,
      brew.recipe.fresh ? 1 : 0,
      JSON.stringify(brew.recipe.stages),
      brew.elapsedMs,
      brew.yieldG,
      brew.taste?.sourBitter ?? null,
      brew.taste?.weakStrong ?? null,
      brew.taste?.notes ?? null,
      brew.suggestion,
    ],
  )
}

type SetupRow = {
  id: string
  name: string
  active: number
  machine_id: string | null
  grinder_id: string | null
  custom_machine_brand: string | null
  custom_machine_model: string | null
  custom_machine_heating: string | null
  custom_machine_pid: number | null
  custom_machine_brew_bar: number | null
  custom_machine_pump_bar: number | null
  custom_machine_portafilter_mm: number | null
  custom_machine_pre_infusion: string | null
  custom_machine_flow_control: number | null
  custom_grinder_brand: string | null
  custom_grinder_model: string | null
  custom_grinder_burr_type: string | null
  custom_grinder_burr_mm: number | null
  custom_grinder_adjustment: Setup['customGrinder'] extends infer T ? (T extends { adjustment: infer A } ? A : null) : null
  custom_grinder_steps: number | null
  custom_grinder_espresso_range: string | null
  custom_grinder_filter_range: string | null
}

export function readDial(db: Sql): DialState {
  const setups = db.all<SetupRow>('SELECT * FROM setups ORDER BY name').map(setupFromRow)
  const active = setups.find((setup) => setup.active)?.id ?? null
  const machines: DialState['overrides']['machines'] = {}
  for (const row of db.all<{ machine_id: string; field: string; value_text: string }>('SELECT * FROM machine_overrides')) {
    const key = SQL_TO_MACHINE[row.field]
    if (!key) continue
    machines[row.machine_id] = { ...machines[row.machine_id], [key]: parseOverride(row.field, row.value_text) }
  }
  const grinders: DialState['overrides']['grinders'] = {}
  for (const row of db.all<{ grinder_id: string; field: string; value_text: string }>('SELECT * FROM grinder_overrides')) {
    const key = SQL_TO_GRINDER[row.field]
    if (!key) continue
    grinders[row.grinder_id] = { ...grinders[row.grinder_id], [key]: parseOverride(row.field, row.value_text) }
  }
  const beans = db.all<{ id: string; name: string; roaster: string; origin: string; process: DialState['beans'][number]['process']; roast: DialState['beans'][number]['roast']; roast_date: string; notes: string }>(
    'SELECT * FROM beans ORDER BY name',
  )
  const brews = db.all<{
    id: string
    at: string
    method: SavedBrew['method']
    bean_id: string
    setup_id: string
    dose_g: number
    water_g: number
    yield_g: number
    temp_c: number
    grind: string
    fresh: number
    stages_json: string
    elapsed_ms: number
    actual_yield_g: number | null
    sour_bitter: number | null
    weak_strong: number | null
    taste_notes: string | null
    suggestion: string | null
  }>('SELECT * FROM brews ORDER BY at DESC')
  return {
    version: 1,
    setups: setups.map(({ active: _active, ...setup }) => setup),
    activeSetupId: active,
    overrides: { machines, grinders },
    beans: beans.map((bean) => ({
      id: bean.id,
      name: bean.name,
      roaster: bean.roaster,
      origin: bean.origin,
      process: bean.process,
      roast: bean.roast,
      roastDate: bean.roast_date,
      notes: bean.notes,
    })),
    brews: brews.map((brew) => ({
      id: brew.id,
      at: brew.at,
      method: brew.method,
      beanId: brew.bean_id,
      setupId: brew.setup_id,
      recipe: {
        method: brew.method,
        doseG: brew.dose_g,
        waterG: brew.water_g,
        yieldG: brew.yield_g,
        tempC: brew.temp_c,
        grind: brew.grind,
        fresh: brew.fresh === 1,
        stages: JSON.parse(brew.stages_json) as Recipe['stages'],
      },
      elapsedMs: brew.elapsed_ms,
      yieldG: brew.actual_yield_g,
      taste: brew.sour_bitter == null || brew.weak_strong == null ? null : { sourBitter: brew.sour_bitter, weakStrong: brew.weak_strong, notes: brew.taste_notes ?? '' },
      suggestion: brew.suggestion,
    })),
  }
}

function setupFromRow(row: SetupRow): Setup & { active: boolean } {
  const customMachine = row.custom_machine_brand
    ? {
        brand: row.custom_machine_brand,
        model: row.custom_machine_model ?? '',
        heating: row.custom_machine_heating,
        pid: bool(row.custom_machine_pid),
        brewBar: row.custom_machine_brew_bar,
        pumpBar: row.custom_machine_pump_bar,
        portafilterMm: row.custom_machine_portafilter_mm,
        preInfusion: row.custom_machine_pre_infusion,
        flowControl: bool(row.custom_machine_flow_control),
      }
    : null
  const customGrinder = row.custom_grinder_brand
    ? {
        brand: row.custom_grinder_brand,
        model: row.custom_grinder_model ?? '',
        burrType: row.custom_grinder_burr_type,
        burrSizeMm: row.custom_grinder_burr_mm,
        adjustment: row.custom_grinder_adjustment,
        steps: row.custom_grinder_steps,
        espressoRange: row.custom_grinder_espresso_range,
        filterRange: row.custom_grinder_filter_range,
      }
    : null
  return {
    id: row.id,
    name: row.name,
    active: row.active === 1,
    machineId: row.machine_id,
    grinderId: row.grinder_id,
    customMachine,
    customGrinder,
  }
}

export function legacyAlreadyImported(db: Sql) {
  const rows = db.all<{ value: string }>('SELECT value FROM meta WHERE key = ?', ['idb_dial_v1'])
  return rows.length > 0
}

/** Copies a version-1 JSON dial document into SQL once. The catalog rows are left alone. */
export function importLegacyOnce(db: Sql, legacy: DialState | null) {
  if (legacyAlreadyImported(db)) return false
  const existing = db.all<{ n: number }>('SELECT COUNT(*) AS n FROM setups')
  if (legacy && (existing[0]?.n ?? 0) === 0 && (legacy.setups.length || legacy.beans.length || legacy.brews.length)) {
    replaceUserData(db, legacy)
  }
  db.run('INSERT INTO meta (key, value) VALUES (?, ?)', ['idb_dial_v1', '1'])
  return true
}
