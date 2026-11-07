import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { CHECKLIST, flow, ratio, styleLabel, verdict, type Shot } from '../lib/brew'
import { ease } from '../lib/motion'
import { AnimatedNumber } from './AnimatedNumber'
import { ShotChart } from './ShotChart'

type LogEntry = Shot & { id: number; at: string }

type Props = {
  open: boolean
  onClose: () => void
  shot: Shot
  playKey: number
  checks: boolean[]
  onToggle: (index: number) => void
  log: LogEntry[]
  onLog: () => void
  onClear: () => void
}

function Tick() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <motion.path
        d="M5 12.5l4.2 4.2L19 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, ease }}
      />
    </svg>
  )
}

export function DetailDrawer({ open, onClose, shot, playKey, checks, onToggle, log, onLog, onClear }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const r = ratio(shot)
  const fl = flow(shot)
  const st = styleLabel(r)
  const [vTitle, vBody] = verdict(shot)
  const done = checks.filter(Boolean).length

  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    if (open && !dlg.open) dlg.showModal()
    if (!open && dlg.open) dlg.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="drawer"
      aria-labelledby="detailH"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      <div className="drawer-body">
        <header className="drawer-h">
          <div>
            <p className="eyebrow">Shot detail</p>
            <h2 id="detailH">Curve, checklist, log</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close details">
            ×
          </button>
        </header>
        <div className="stats">
          <div>
            <small>Ratio</small>
            <b aria-hidden="true">
              <AnimatedNumber value={r} format={(n) => '1:' + n.toFixed(1)} />
            </b>
          </div>
          <div>
            <small>Flow (demo)</small>
            <b aria-hidden="true">
              <AnimatedNumber value={fl} format={(n) => n.toFixed(1)} />
              <em> g/s</em>
            </b>
          </div>
          <div>
            <small>Style</small>
            <b>{st}</b>
          </div>
        </div>
        <ShotChart shot={shot} playKey={playKey} />
        <p className="note">
          <strong>Illustration only.</strong> The cup and this curve follow your dose, yield and time with a smooth shape.
          They do not measure grind, puck prep, or extraction. Taste is the judge.
        </p>
        <div className="verdict-box">
          <small>Quick read (rule of thumb)</small>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={vTitle}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease }}
            >
              <p className="verdict">{vTitle}</p>
              <p className="quiet">{vBody}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <p className="label">
          Pre-shot checklist <span>{done}/4</span>
        </p>
        <ol className="steps">
          {CHECKLIST.map((item, i) => (
            <li key={item}>
              <button type="button" aria-pressed={checks[i]} onClick={() => onToggle(i)}>
                <span className="dot">{checks[i] ? <Tick /> : i + 1}</span>
                <span>{item}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="row-btns">
          <button type="button" className="btn" onClick={onLog}>
            Log this shot
          </button>
          <button type="button" className="btn ghost" disabled={!log.length} onClick={onClear}>
            Clear log
          </button>
        </div>
        <section aria-labelledby="logH">
          <h3 id="logH">Today’s log</h3>
          <p className="quiet">Kept in this tab only. Nothing is saved or sent. Last 8 shots.</p>
          {log.length === 0 ? (
            <p className="quiet">No shots logged yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <caption className="sr">Logged demo shots</caption>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Time</th>
                    <th>In</th>
                    <th>Out</th>
                    <th>Shot</th>
                    <th>Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((e, i) => (
                    <tr key={e.id}>
                      <td>{log.length - i}</td>
                      <td>{e.at}</td>
                      <td>{e.d}g</td>
                      <td>{e.y}g</td>
                      <td>{e.t}s</td>
                      <td>1:{(e.y / e.d).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <p className="quiet">
          Ratio is yield ÷ dose. Flow is average grams per second after a short pre-infusion. Style is a loose bar word
          (ristretto under 1:1.5, normale to about 1:2.5, lungo beyond).
        </p>
      </div>
    </dialog>
  )
}
