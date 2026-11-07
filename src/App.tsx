import { MotionConfig } from 'framer-motion'
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Brew } from './components/Brew'
import { tokens } from './theme/tokens'

const Journal = lazy(() => import('./journal/Journal').then((m) => ({ default: m.Journal })))

type Tab = 'brew' | 'journal'

const fromHash = (): Tab => (location.hash === '#journal' ? 'journal' : 'brew')

export default function App() {
  const [tab, setTab] = useState<Tab>(fromHash)
  const [journalOn, setJournalOn] = useState(fromHash() === 'journal')
  const [live, setLive] = useState('')
  const [demoOn, setDemoOn] = useState(true)
  const say = useCallback((m: string) => setLive(m), [])
  const onDemos = useCallback((on: boolean) => setDemoOn(on), [])
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ brew: null, journal: null })

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--bg', tokens.bg)
    root.style.setProperty('--bg-deep', tokens.bgDeep)
    root.style.setProperty('--surface', tokens.surface)
    root.style.setProperty('--text', tokens.text)
    root.style.setProperty('--label', tokens.label)
    root.style.setProperty('--muted', tokens.muted)
    root.style.setProperty('--amber', tokens.amber)
    root.style.setProperty('--cream', tokens.cream)
    root.style.setProperty('--cream-text', tokens.creamText)
    root.style.setProperty('--chip-on', tokens.chipOn)
    root.style.setProperty('--line', tokens.line)
  }, [])

  useEffect(() => {
    const on = () => setTab(fromHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  const go = (next: Tab, focus = false) => {
    setTab(next)
    if (next === 'journal') setJournalOn(true)
    history.replaceState(null, '', next === 'journal' ? '#journal' : '#brew')
    if (focus) tabRefs.current[next]?.focus()
  }
  const onTabKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    go(tab === 'brew' ? 'journal' : 'brew', true)
  }

  return (
    <MotionConfig reducedMotion="user">
      <a className="skip" href="#main">
        Skip to {tab === 'brew' ? 'brew controls' : 'café journal'}
      </a>
      <div className="stage">
        <div className="phone">
          <header className="top">
            <h1>{tab === 'brew' ? 'Crema' : 'Journal'}</h1>
            {tab === 'brew' ? (
              <span className="pill" aria-label="Brew figures and the pour are simulated">
                Simulated
              </span>
            ) : (
              demoOn && (
                <span className="pill" aria-label="Sample cafés on this map are fictional">
                  Demo
                </span>
              )
            )}
          </header>
          <main id="main" role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={-1}>
            <div className="pane" hidden={tab !== 'brew'}>
              <Brew say={say} active={tab === 'brew'} />
            </div>
            {journalOn && (
              <div className="pane" hidden={tab !== 'journal'}>
                <Suspense fallback={<p className="quiet pad">Opening the map…</p>}>
                  <Journal say={say} active={tab === 'journal'} onDemos={onDemos} />
                </Suspense>
              </div>
            )}
          </main>
          <nav className="tabbar" role="tablist" aria-label="Sections" onKeyDown={onTabKey}>
            <button
              ref={(el) => {
                tabRefs.current.brew = el
              }}
              role="tab"
              id="tab-brew"
              aria-selected={tab === 'brew'}
              aria-controls="main"
              tabIndex={tab === 'brew' ? 0 : -1}
              type="button"
              onClick={() => go('brew')}
            >
              <CupIcon />
              Brew
            </button>
            <button
              ref={(el) => {
                tabRefs.current.journal = el
              }}
              role="tab"
              id="tab-journal"
              aria-selected={tab === 'journal'}
              aria-controls="main"
              tabIndex={tab === 'journal' ? 0 : -1}
              type="button"
              onClick={() => go('journal')}
            >
              <BookIcon />
              Journal
            </button>
          </nav>
        </div>
      </div>
      <p className="sr" aria-live="polite">
        {live}
      </p>
    </MotionConfig>
  )
}

function CupIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.2" fill="currentColor" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4.5h9.5A1.5 1.5 0 0 1 18 6v13.5H8.2A2.2 2.2 0 0 0 6 21.7V6.7A2.2 2.2 0 0 1 8.2 4.5H7z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 8.5h6M9 12h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
