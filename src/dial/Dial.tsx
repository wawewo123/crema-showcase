import { useEffect, useMemo, useState } from 'react'
import { GRINDERS, MACHINES, grinderById, machineById, type Grinder, type Machine } from './catalog'
import { bestForBean } from './history'
import { MACHINE_KEYS, keepFillable, presentGrinder, presentMachine, type MachineKey } from './overrides'
import { daysOffRoast, startingRecipe, type Method, type Process, type Recipe, type Roast } from './recipe'
import { suggest, type Taste } from './rules'
import type { Bean, DialState, SavedBrew, Setup } from './state'
import { loadDial, saveDial } from './store'
import { elapsedMs, idleClock, pauseClock, resumeClock, startClock, type Clock } from './timer'
import { validateBean, validateMachine } from './validate'
import { newId } from '../journal/storage'

type View = 'home' | 'kits' | 'machines' | 'grinders' | 'specs' | 'beans' | 'bean' | 'guide' | 'taste' | 'history'

const METHODS: { id: Method; label: string }[] = [
  { id: 'espresso', label: 'Espresso' },
  { id: 'v60', label: 'V60' },
  { id: 'aeropress', label: 'AeroPress' },
  { id: 'cold-brew', label: 'Cold brew' },
]

const MACHINE_LABEL: Record<MachineKey, string> = {
  heating: 'Heating',
  pid: 'PID',
  brewBar: 'Brew pressure',
  pumpBar: 'Pump pressure',
  portafilterMm: 'Portafilter',
  preInfusion: 'Pre-infusion',
  flowControl: 'Flow control',
}

function formatDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

function showValue(value: string | number | boolean | null, key: string) {
  if (value == null) return 'Not stated'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (key === 'brewBar' || key === 'pumpBar') return `${value} bar`
  if (key === 'portafilterMm' || key === 'burrSizeMm') return `${value} mm`
  if (key === 'steps') return `${value} steps`
  return String(value)
}

export function Dial({ say }: { say: (m: string) => void }) {
  const [state, setState] = useState<DialState | null>(null)
  const [view, setView] = useState<View>('home')
  const [method, setMethod] = useState<Method>('espresso')
  const [beanId, setBeanId] = useState<string | null>(null)
  const [setupId, setSetupId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [stage, setStage] = useState(0)
  const [clock, setClock] = useState<Clock>(idleClock())
  const [now, setNow] = useState(() => Date.now())
  const [yieldDraft, setYieldDraft] = useState('')
  const [taste, setTaste] = useState<Taste>({ sourBitter: 3, weakStrong: 3, notes: '' })
  const [shotSeconds, setShotSeconds] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDial().then((loaded) => {
      setState(loaded)
      setSetupId(loaded.activeSetupId)
      setBeanId(loaded.beans[0]?.id ?? null)
    })
  }, [])

  useEffect(() => {
    if (!clock.running) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    const onVis = () => setNow(Date.now())
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [clock.running])

  const persist = async (next: DialState) => {
    setState(next)
    const saved = await saveDial(next)
    if (!saved.ok) say(saved.reason)
  }

  const setup = state?.setups.find((s) => s.id === (setupId ?? state.activeSetupId)) ?? null
  const bean = state?.beans.find((b) => b.id === beanId) ?? null
  const machine = setup?.machineId ? machineById(setup.machineId) : null
  const grinder = setup?.grinderId ? grinderById(setup.grinderId) : null

  if (!state) return <p className="quiet pad">Opening dial-in…</p>

  const start = () => {
    if (!bean || !setup) {
      setError('Choose a kit and a bean first.')
      return
    }
    const days = daysOffRoast(bean.roastDate, new Date().toISOString())
    const shown = grinder ? presentGrinder(grinder, state.overrides.grinders[grinder.id]) : null
    const next = startingRecipe({
      method,
      roast: bean.roast,
      days,
      grinder: shown
        ? {
            espressoRange: shown.espressoRange.value as string | null,
            filterRange: shown.filterRange.value as string | null,
            espressoSuitable: shown.espressoSuitable.value as boolean | null,
            filterSuitable: shown.filterSuitable.value as boolean | null,
          }
        : setup.customGrinder
          ? {
              espressoRange: setup.customGrinder.espressoRange,
              filterRange: setup.customGrinder.filterRange,
              espressoSuitable: null,
              filterSuitable: null,
            }
          : null,
    })
    setRecipe(next)
    setStage(0)
    setClock(idleClock())
    setYieldDraft(String(next.yieldG))
    setTaste({ sourBitter: 3, weakStrong: 3, notes: '' })
    setError(null)
    setView('guide')
  }

  return (
    <div className="dial" data-testid="dial-screen">
      {view === 'home' && (
        <div className="dial-pad">
          <p className="eyebrow">Real brew</p>
          <h2>Dial in</h2>
          <p className="quiet">A starting recipe for this bag and this kit. The Brew tab stays a simulation.</p>
          <button type="button" className="btn ghost wide" data-testid="open-kits" onClick={() => setView('kits')}>
            Kit: {setup ? setup.name : 'Choose'}
          </button>
          <button type="button" className="btn ghost wide" data-testid="open-beans" onClick={() => setView('beans')}>
            Bean: {bean ? bean.name : 'Choose'}
          </button>
          <div className="method-row" role="group" aria-label="Brew method">
            {METHODS.map((m) => (
              <button key={m.id} type="button" className="chip" aria-pressed={method === m.id} data-testid={`method-${m.id}`} onClick={() => setMethod(m.id)}>
                {m.label}
              </button>
            ))}
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="button" className="pour" data-testid="start-brew" onClick={start}>
            Start brew
          </button>
          <button type="button" className="text-btn" data-testid="open-history" onClick={() => setView('history')}>
            History
          </button>
        </div>
      )}
      {view === 'kits' && (
        <Kits
          state={state}
          onBack={() => setView('home')}
          onChange={persist}
          onPickMachine={() => {
            setQuery('')
            setView('machines')
          }}
          onPickGrinder={() => {
            setQuery('')
            setView('grinders')
          }}
          onSpecs={() => setView('specs')}
          activeId={setup?.id ?? null}
          onCreate={(row) => {
            setSetupId(row.id)
            persist({ ...state, setups: [...state.setups, row], activeSetupId: row.id })
          }}
          onActive={(id) => {
            setSetupId(id)
            persist({ ...state, activeSetupId: id })
          }}
        />
      )}
      {view === 'machines' && (
        <Picker
          title="Machines"
          testId="kit-picker"
          query={query}
          setQuery={setQuery}
          rows={MACHINES.filter((m) => `${m.brand} ${m.model}`.toLowerCase().includes(query.toLowerCase())).map((m) => ({
            id: m.id,
            label: `${m.brand} ${m.model}`,
          }))}
          onBack={() => setView('kits')}
          onPick={(id) => {
            if (!setup) return
            const next = { ...state, setups: state.setups.map((s) => (s.id === setup.id ? { ...s, machineId: id, customMachine: null } : s)) }
            persist(next)
            setView('specs')
          }}
        />
      )}
      {view === 'grinders' && (
        <Picker
          title="Grinders"
          testId="grinder-picker"
          query={query}
          setQuery={setQuery}
          rows={GRINDERS.filter((g) => `${g.brand} ${g.model}`.toLowerCase().includes(query.toLowerCase())).map((g) => ({
            id: g.id,
            label: `${g.brand} ${g.model}`,
          }))}
          onBack={() => setView('kits')}
          onPick={(id) => {
            if (!setup) return
            persist({ ...state, setups: state.setups.map((s) => (s.id === setup.id ? { ...s, grinderId: id, customGrinder: null } : s)) })
            setView('kits')
          }}
        />
      )}
      {view === 'specs' && machine && (
        <SpecSheet
          machine={machine}
          override={state.overrides.machines[machine.id]}
          onBack={() => setView('kits')}
          onSave={(patch) => {
            const kept = keepFillable(machine, patch, MACHINE_KEYS)
            const check = validateMachine({
              brand: machine.brand,
              model: machine.model,
              heating: (kept.heating as string | null) ?? machine.heating,
              pid: (kept.pid as boolean | null) ?? machine.pid,
              brewBar: (kept.brewBar as number | null) ?? machine.brewBar,
              pumpBar: (kept.pumpBar as number | null) ?? machine.pumpBar,
              portafilterMm: (kept.portafilterMm as number | null) ?? machine.portafilterMm,
              preInfusion: (kept.preInfusion as string | null) ?? machine.preInfusion,
              flowControl: (kept.flowControl as boolean | null) ?? machine.flowControl,
            })
            if (!check.ok) {
              setError(check.errors.join(' '))
              return
            }
            setError(null)
            persist({
              ...state,
              overrides: { ...state.overrides, machines: { ...state.overrides.machines, [machine.id]: { ...state.overrides.machines[machine.id], ...kept } } },
            })
            say('Saved on this kit only')
          }}
          error={error}
        />
      )}
      {view === 'beans' && (
        <div className="dial-pad" data-testid="bean-list">
          <button type="button" className="text-btn" onClick={() => setView('home')}>Back</button>
          <h2>Beans</h2>
          <button type="button" className="btn" data-testid="add-bean" onClick={() => setView('bean')}>Add a bean</button>
          <ul className="visit-list">
            {state.beans.map((b) => (
              <li key={b.id}>
                <button type="button" className="visit" aria-pressed={b.id === beanId} onClick={() => { setBeanId(b.id); setView('home') }}>
                  <span className="visit-name">{b.name}</span>
                  <span className="visit-meta">{b.roaster} · {daysOffRoast(b.roastDate, new Date().toISOString())} days off roast</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {view === 'bean' && (
        <BeanForm
          onBack={() => setView('beans')}
          onSave={(b) => {
            const check = validateBean(b)
            if (!check.ok) {
              setError(check.errors.join(' '))
              return
            }
            const beanRow: Bean = { ...b, id: newId(), process: b.process, roast: b.roast }
            setBeanId(beanRow.id)
            setError(null)
            persist({ ...state, beans: [beanRow, ...state.beans] })
            setView('home')
          }}
          error={error}
        />
      )}
      {view === 'guide' && recipe && (
        <Guide
          recipe={recipe}
          stage={stage}
          clock={clock}
          now={now}
          yieldDraft={yieldDraft}
          setYieldDraft={setYieldDraft}
          onStart={() => {
            setClock(startClock(Date.now()))
            setNow(Date.now())
          }}
          onPause={() => setClock((c) => pauseClock(c, Date.now()))}
          onResume={() => {
            setClock((c) => resumeClock(c, Date.now()))
            setNow(Date.now())
          }}
          onCancel={() => setView('home')}
          onNext={() => {
            const current = elapsedMs(clock, Date.now())
            if (stage + 1 >= recipe.stages.length) {
              setShotSeconds(Math.round(current / 1000))
              setClock(pauseClock(clock, Date.now()))
              setView('taste')
              return
            }
            setStage((n) => n + 1)
            setClock(startClock(Date.now()))
            setNow(Date.now())
          }}
        />
      )}
      {view === 'taste' && recipe && bean && setup && (
        <TasteView
          recipe={recipe}
          taste={taste}
          setTaste={setTaste}
          suggestion={suggest({
            method: recipe.method,
            recipe,
            shotTimeS: shotSeconds,
            taste,
            adjustment: grinder ? (presentGrinder(grinder, state.overrides.grinders[grinder.id]).adjustment.value as Grinder['adjustment']) : setup.customGrinder?.adjustment ?? null,
          })}
          onSave={() => {
            const idea = suggest({
              method: recipe.method,
              recipe,
              shotTimeS: shotSeconds,
              taste,
              adjustment: grinder ? (presentGrinder(grinder, state.overrides.grinders[grinder.id]).adjustment.value as Grinder['adjustment']) : setup.customGrinder?.adjustment ?? null,
            })
            const row: SavedBrew = {
              id: newId(),
              at: new Date().toISOString(),
              method: recipe.method,
              beanId: bean.id,
              setupId: setup.id,
              recipe,
              elapsedMs: shotSeconds == null ? 0 : shotSeconds * 1000,
              yieldG: Number(yieldDraft) || null,
              taste,
              suggestion: idea.change,
            }
            persist({ ...state, brews: [row, ...state.brews] })
            say('Brew saved on this device')
            setView('history')
          }}
        />
      )}
      {view === 'history' && <History state={state} onBack={() => setView('home')} />}
    </div>
  )
}

function Kits(props: {
  state: DialState
  activeId: string | null
  onBack: () => void
  onChange: (next: DialState) => void
  onPickMachine: () => void
  onPickGrinder: () => void
  onSpecs: () => void
  onCreate: (row: Setup) => void
  onActive: (id: string) => void
}) {
  const [name, setName] = useState('Home')
  const active = props.state.setups.find((s) => s.id === props.activeId) ?? null
  const machine = active?.machineId ? machineById(active.machineId) : null
  const grinder = active?.grinderId ? grinderById(active.grinderId) : null
  return (
    <div className="dial-pad" data-testid="kits">
      <button type="button" className="text-btn" onClick={props.onBack}>Back</button>
      <h2>My kit</h2>
      <label>
        Setup name
        <input data-testid="setup-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
      </label>
      <button
        type="button"
        className="btn"
        data-testid="add-setup"
        onClick={() => {
          props.onCreate({ id: newId(), name: name.trim() || 'Home', machineId: null, grinderId: null, customMachine: null, customGrinder: null })
        }}
      >
        Save setup
      </button>
      <ul className="visit-list">
        {props.state.setups.map((s) => (
          <li key={s.id}>
            <button type="button" className="visit" aria-pressed={s.id === props.activeId} onClick={() => props.onActive(s.id)}>
              <span className="visit-name">{s.name}</span>
            </button>
          </li>
        ))}
      </ul>
      {active && (
        <>
          <button type="button" className="btn ghost wide" data-testid="choose-machine" onClick={props.onPickMachine}>
            Machine: {machine ? `${machine.brand} ${machine.model}` : 'Choose'}
          </button>
          <button type="button" className="btn ghost wide" data-testid="choose-grinder" onClick={props.onPickGrinder}>
            Grinder: {grinder ? `${grinder.brand} ${grinder.model}` : 'Choose'}
          </button>
          {machine && (
            <button type="button" className="text-btn" data-testid="open-specs" onClick={props.onSpecs}>
              Machine specs
            </button>
          )}
        </>
      )}
    </div>
  )
}

function Picker(props: {
  title: string
  testId: string
  query: string
  setQuery: (q: string) => void
  rows: { id: string; label: string }[]
  onBack: () => void
  onPick: (id: string) => void
}) {
  return (
    <div className="dial-pad" data-testid={props.testId}>
      <button type="button" className="text-btn" onClick={props.onBack}>Back</button>
      <h2>{props.title}</h2>
      <input aria-label={`Search ${props.title}`} data-testid="catalog-search" value={props.query} onChange={(e) => props.setQuery(e.target.value)} placeholder="Search" />
      <ul className="visit-list">
        {props.rows.map((row) => (
          <li key={row.id}>
            <button type="button" className="visit" data-testid={`pick-${row.id}`} onClick={() => props.onPick(row.id)}>
              <span className="visit-name">{row.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SpecSheet(props: {
  machine: Machine
  override: DialState['overrides']['machines'][string] | undefined
  onBack: () => void
  onSave: (patch: Record<string, unknown>) => void
  error: string | null
}) {
  const shown = presentMachine(props.machine, props.override)
  const [pid, setPid] = useState(shown.pid.value === true ? 'yes' : shown.pid.value === false ? 'no' : '')
  return (
    <div className="dial-pad" data-testid="spec-sheet">
      <button type="button" className="text-btn" onClick={props.onBack}>Back</button>
      <h2>{props.machine.brand} {props.machine.model}</h2>
      <p className="quiet">Source data stays as published. Anything you add is stored only on this device.</p>
      <ul className="spec-list">
        {MACHINE_KEYS.map((key) => (
          <li key={key} data-testid={`spec-${key}`}>
            <span>{MACHINE_LABEL[key]}</span>
            <strong>{showValue(shown[key].value, key)}</strong>
            <em data-testid={`origin-${key}`}>{shown[key].origin === 'sourced' ? 'sourced' : shown[key].origin === 'yours' ? 'added by you' : ''}</em>
          </li>
        ))}
      </ul>
      {shown.pid.origin === 'unknown' && (
        <label>
          PID, if you know it
          <select data-testid="fill-pid" value={pid} onChange={(e) => setPid(e.target.value)}>
            <option value="">Unknown</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
      )}
      {props.error && <p className="form-error" role="alert">{props.error}</p>}
      <button
        type="button"
        className="btn"
        data-testid="save-override"
        onClick={() => props.onSave(pid === '' ? {} : { pid: pid === 'yes' })}
      >
        Save on my kit
      </button>
      <p className="quiet">
        <a href={props.machine.sourceUrl} target="_blank" rel="noopener noreferrer">Source</a>
      </p>
    </div>
  )
}

function BeanForm(props: { onBack: () => void; onSave: (b: Omit<Bean, 'id'>) => void; error: string | null }) {
  const [name, setName] = useState('Red Brick')
  const [roaster, setRoaster] = useState('')
  const [origin, setOrigin] = useState('')
  const [process, setProcess] = useState<Process>('washed')
  const [roast, setRoast] = useState<Roast>('medium')
  const [roastDate, setRoastDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  return (
    <form
      className="dial-pad visit-form"
      data-testid="bean-form"
      onSubmit={(e) => {
        e.preventDefault()
        props.onSave({ name, roaster, origin, process, roast, roastDate, notes })
      }}
    >
      <button type="button" className="text-btn" onClick={props.onBack}>Back</button>
      <h2>New bean</h2>
      <label>Name<input data-testid="bean-name" value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label>Roaster<input data-testid="bean-roaster" value={roaster} onChange={(e) => setRoaster(e.target.value)} /></label>
      <label>Origin<input data-testid="bean-origin" value={origin} onChange={(e) => setOrigin(e.target.value)} /></label>
      <label>
        Process
        <select value={process} onChange={(e) => setProcess(e.target.value as Process)}>
          {(['washed', 'natural', 'honey', 'anaerobic', 'other'] as const).map((p) => <option key={p}>{p}</option>)}
        </select>
      </label>
      <label>
        Roast
        <select data-testid="bean-roast" value={roast} onChange={(e) => setRoast(e.target.value as Roast)}>
          {(['light', 'medium-light', 'medium', 'medium-dark', 'dark'] as const).map((p) => <option key={p}>{p}</option>)}
        </select>
      </label>
      <label>Roast date<input type="date" data-testid="bean-date" value={roastDate} onChange={(e) => setRoastDate(e.target.value)} /></label>
      <label>Notes<textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></label>
      {props.error && <p className="form-error" role="alert">{props.error}</p>}
      <button className="btn" type="submit" data-testid="save-bean">Save bean</button>
    </form>
  )
}

function Guide(props: {
  recipe: Recipe
  stage: number
  clock: Clock
  now: number
  yieldDraft: string
  setYieldDraft: (v: string) => void
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onNext: () => void
  onCancel: () => void
}) {
  const current = props.recipe.stages[props.stage]
  const ms = elapsedMs(props.clock, props.now)
  return (
    <div className="dial-pad" data-testid="guide">
      <button type="button" className="text-btn" data-testid="guide-back" onClick={props.onCancel}>Back</button>
      <p className="eyebrow">{props.recipe.method}</p>
      <h2 data-testid="stage-label">{current.label}</h2>
      <p className="timer-readout" data-testid="timer">{formatDuration(ms)}</p>
      <p className="quiet">{current.cue}</p>
      {current.targetG != null && <p className="quiet">Target {current.targetG} g</p>}
      <p className="quiet">{props.recipe.grind} Water {props.recipe.tempC}°C.</p>
      <div className="row-btns">
        {!props.clock.running && props.clock.offsetMs === 0 && (
          <button type="button" className="btn" data-testid="timer-start" onClick={props.onStart}>Start</button>
        )}
        {props.clock.running && (
          <button type="button" className="btn ghost" onClick={props.onPause}>Pause</button>
        )}
        {!props.clock.running && props.clock.offsetMs > 0 && (
          <button type="button" className="btn ghost" onClick={props.onResume}>Resume</button>
        )}
        <button type="button" className="btn" data-testid="timer-next" onClick={props.onNext}>
          {props.stage + 1 >= props.recipe.stages.length ? 'Taste' : 'Next stage'}
        </button>
      </div>
      {props.recipe.method === 'espresso' && (
        <label>
          Yield in grams
          <input data-testid="yield-entry" inputMode="decimal" value={props.yieldDraft} onChange={(e) => props.setYieldDraft(e.target.value)} />
        </label>
      )}
    </div>
  )
}

function TasteView(props: {
  recipe: Recipe
  taste: Taste
  setTaste: (t: Taste) => void
  suggestion: { change: string; reason: string }
  onSave: () => void
}) {
  return (
    <div className="dial-pad" data-testid="taste">
      <h2>Taste and fix</h2>
      <p className="label">Sour to bitter</p>
      <div className="scale" role="group" aria-label="Sour to bitter">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" className="chip" aria-pressed={props.taste.sourBitter === n} data-testid={`sour-${n}`} onClick={() => props.setTaste({ ...props.taste, sourBitter: n })}>
            {n}
          </button>
        ))}
      </div>
      <p className="label">Weak to strong</p>
      <div className="scale" role="group" aria-label="Weak to strong">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" className="chip" aria-pressed={props.taste.weakStrong === n} data-testid={`strong-${n}`} onClick={() => props.setTaste({ ...props.taste, weakStrong: n })}>
            {n}
          </button>
        ))}
      </div>
      <label>
        Notes
        <textarea value={props.taste.notes} onChange={(e) => props.setTaste({ ...props.taste, notes: e.target.value })} rows={2} />
      </label>
      <article className="suggestion" data-testid="suggestion">
        <p className="eyebrow">One change</p>
        <p>{props.suggestion.change}</p>
        <p className="quiet">{props.suggestion.reason}</p>
      </article>
      <button type="button" className="pour" data-testid="save-brew" onClick={props.onSave}>Save brew</button>
    </div>
  )
}

function History(props: { state: DialState; onBack: () => void }) {
  const beans = props.state.beans
  const best = useMemo(() => beans.map((b) => ({ bean: b, brew: bestForBean(props.state.brews.map(toRecord), b.id) })), [beans, props.state.brews])
  return (
    <div className="dial-pad" data-testid="history">
      <button type="button" className="text-btn" onClick={props.onBack}>Back</button>
      <h2>History</h2>
      {best.map(({ bean, brew }) =>
        brew ? (
          <p key={bean.id} className="quiet" data-testid={`best-${bean.id}`}>
            Your best for {bean.name}: {brew.recipeDoseG} g at {brew.recipeTempC}°C
          </p>
        ) : null,
      )}
      <ul className="visit-list">
        {props.state.brews.map((b) => (
          <li key={b.id}>
            <div className="visit">
              <span className="visit-name">{b.method} · {beans.find((bean) => bean.id === b.beanId)?.name ?? 'Bean'}</span>
              <span className="visit-meta">{b.suggestion ?? 'No note'}</span>
            </div>
          </li>
        ))}
      </ul>
      {props.state.brews.length === 0 && <p className="quiet">No brews saved yet.</p>}
    </div>
  )
}

function toRecord(b: SavedBrew) {
  return {
    id: b.id,
    at: b.at,
    method: b.method,
    beanId: b.beanId,
    setupId: b.setupId,
    recipeDoseG: b.recipe.doseG,
    recipeYieldG: b.recipe.yieldG,
    recipeTempC: b.recipe.tempC,
    taste: b.taste,
  }
}
