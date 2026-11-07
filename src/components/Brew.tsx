import { useCallback, useEffect, useRef, useState } from 'react'
import { CHECKLIST, LIMITS, PRESETS, clamp, type Preset, type Shot } from '../lib/brew'
import { reading } from '../lib/reading'
import { usePrefersReducedMotion } from '../lib/motion'
import { CupStage } from './cup/CupStage'
import { DetailDrawer } from './DetailDrawer'
import { RingGauge } from './RingGauge'

type LogEntry = Shot & { id: number; at: string }
type Key = keyof Shot

const SHORT: Record<string, string> = {
  classic: 'Classic',
  ristretto: 'Ristretto',
  turbo: 'Turbo',
  lungo: 'Lungo',
}

function pretty(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function NumField({ k, value, onCommit }: { k: Key; value: number; onCommit: (v: number) => void }) {
  const lim = LIMITS[k]
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? pretty(value)
  const commit = () => {
    const v = parseFloat(shown)
    onCommit(Number.isNaN(v) ? value : clamp(v, lim.min, lim.max))
    setDraft(null)
  }
  return (
    <span className="num">
      <input
        type="number"
        inputMode="decimal"
        min={lim.min}
        max={lim.max}
        step={lim.step}
        aria-label={lim.aria}
        value={shown}
        onFocus={() => setDraft(pretty(value))}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
      />
      <span>{lim.unit}</span>
    </span>
  )
}

export function Brew({ say, active }: { say: (m: string) => void; active: boolean }) {
  const reduced = usePrefersReducedMotion()
  const [cur, setCur] = useState<Preset>(PRESETS[0])
  const [s, setS] = useState<Shot>({ d: PRESETS[0].d, y: PRESETS[0].y, t: PRESETS[0].t })
  const [log, setLog] = useState<LogEntry[]>([])
  const [checks, setChecks] = useState<boolean[]>(() => CHECKLIST.map(() => false))
  const [playKey, setPlayKey] = useState(0)
  const [pouring, setPouring] = useState(false)
  const [detail, setDetail] = useState(false)
  const shotRef = useRef(s)
  shotRef.current = s
  const onPlaying = useCallback((p: boolean) => {
    setPouring((prev) => {
      if (prev && !p) say(`Illustration finished. ${reading(shotRef.current)}`)
      return p
    })
  }, [say])

  useEffect(() => {
    say(reading(s))
    // announce the opening shot once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const matches = (p: Preset) => s.d === p.d && s.y === p.y && s.t === p.t
  const pick = (p: Preset) => {
    const next = { d: p.d, y: p.y, t: p.t }
    setCur(p)
    setS(next)
    setPlayKey((n) => n + 1)
    say(`${p.name} preset. ${reading(next)}`)
  }
  const setKey = (k: Key) => (v: number) => {
    const next = { ...s, [k]: v }
    setS(next)
    say(reading(next))
  }
  const replay = () => {
    setPlayKey((n) => n + 1)
    if (reduced) say(`Illustration finished. ${reading(s)}`)
  }
  const logShot = () => {
    const at = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    setLog((l) => [{ ...s, id: Date.now() + Math.random(), at }, ...l].slice(0, 8))
    say(`Shot logged. ${reading(s)}`)
  }
  const reset = () => {
    const next = { d: cur.d, y: cur.y, t: cur.t }
    setS(next)
    setPlayKey((n) => n + 1)
    say(`Reset to ${cur.name}. ${reading(next)}`)
  }

  return (
    <div className="brew" data-testid="brew-screen">
      <div className="cup-stack">
        <RingGauge shot={s} />
        <CupStage active={active} reduced={reduced} playKey={playKey} yieldG={s.y} onPlaying={onPlaying} />
      </div>
      <p className="readout" aria-hidden="true">
        <span>
          {s.y.toFixed(1)}
          <small>g</small>
        </span>
        <span>
          {pretty(s.t)}
          <small>s</small>
        </span>
      </p>
      <p className="caption">Yield · Time</p>
      <div className="presets" role="group" aria-label="Recipe presets">
        {PRESETS.map((p) => {
          const on = cur.id === p.id && matches(p)
          return (
            <button
              key={p.id}
              type="button"
              className="chip"
              aria-pressed={on}
              aria-label={`${p.name}. ${p.blurb}. ${p.d} grams in, ${p.y} grams out, ${p.t} seconds.`}
              onClick={() => pick(p)}
            >
              {SHORT[p.id] ?? p.name}
            </button>
          )
        })}
      </div>
      <section className="slider-card" aria-label="Dose, yield and time">
        <div className="slider-head">
          <h2>Set the shot</h2>
          <button type="button" className="text-btn" onClick={reset}>
            Reset
          </button>
        </div>
        {(['d', 'y', 't'] as const).map((k) => {
          const lim = LIMITS[k]
          const id = 'rng-' + k
          const pct = ((s[k] - lim.min) / (lim.max - lim.min)) * 100
          const label = k === 'd' ? 'Dose' : k === 'y' ? 'Yield' : 'Time'
          return (
            <div className="ctl" key={k}>
              <label htmlFor={id}>{label}</label>
              <NumField k={k} value={s[k]} onCommit={setKey(k)} />
              <input
                id={id}
                className="range"
                type="range"
                min={lim.min}
                max={lim.max}
                step={lim.step}
                value={s[k]}
                style={{ ['--p' as string]: pct + '%' }}
                aria-valuetext={`${s[k]} ${k === 't' ? 'seconds' : 'grams'}`}
                onChange={(e) => setS((prev) => ({ ...prev, [k]: +e.target.value }))}
                onPointerUp={(e) => say(reading({ ...s, [k]: +e.currentTarget.value }))}
                onKeyUp={(e) => say(reading({ ...s, [k]: +e.currentTarget.value }))}
              />
            </div>
          )
        })}
      </section>
      <button type="button" className="pour" data-testid="pour" aria-busy={pouring} onClick={replay}>
        {pouring ? 'Pouring' : 'Pour'}
      </button>
      <button
        type="button"
        className="text-btn detail-open"
        data-testid="detail-open"
        aria-expanded={detail}
        onClick={() => setDetail(true)}
      >
        Curve, checklist and log
      </button>
      <DetailDrawer
        open={detail}
        onClose={() => setDetail(false)}
        shot={s}
        playKey={playKey}
        checks={checks}
        onToggle={(i) => setChecks((c) => c.map((v, j) => (j === i ? !v : v)))}
        log={log}
        onLog={logShot}
        onClear={() => {
          setLog([])
          say('Log cleared')
        }}
      />
    </div>
  )
}
