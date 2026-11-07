import gsap from 'gsap'
import { useId, useLayoutEffect, useMemo, useRef } from 'react'
import { CHART, chartGeom, fmt, type Shot } from '../lib/brew'
import { usePrefersReducedMotion } from '../lib/motion'

type Props = { shot: Shot; playKey: number; onPlaying?: (playing: boolean) => void }

/**
 * Synthetic shot curve. Geometry is pure React (re-renders as you drag);
 * the "pour" is a GSAP timeline that only runs when playKey changes
 * (preset picked, reset, replay) so dragging stays direct and instant.
 */
export function ShotChart({ shot, playKey, onPlaying }: Props) {
  const g = useMemo(() => chartGeom(shot), [shot])
  const { W, H, T, B, L, R } = CHART
  const uid = useId().replace(/:/g, '')
  const root = useRef<SVGSVGElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const finalize = useRef<() => void>(() => {})
  const reduced = usePrefersReducedMotion()
  const shotRef = useRef(shot)
  shotRef.current = shot
  const geomRef = useRef(g)
  geomRef.current = g

  // Dragging mid-pour: stop the timeline and show the live geometry.
  useLayoutEffect(() => {
    if (tl.current?.isActive()) {
      tl.current.kill()
      finalize.current()
      onPlaying?.(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shot])

  // Pour timeline
  useLayoutEffect(() => {
    const svg = root.current
    if (!svg) return
    const q = gsap.utils.selector(svg)
    const s = shotRef.current
    const geo = geomRef.current
    tl.current?.kill()
    const readout = svg.querySelector<SVGTextElement>('.pour-readout')
    const setReadout = (t: number) => {
      if (readout) readout.textContent = `${fmt(geo.yieldAt(t))} g · ${t.toFixed(1)} s`
    }
    const finalState = () => {
      gsap.set(q('.clip-yield'), { attr: { width: W } })
      gsap.set(q('.clip-flow'), { attr: { width: W } })
      gsap.set(q('.preinf'), { scaleX: 1, opacity: 1 })
      gsap.set(q('.area, .flow, .end-dot, .end-label, .preinf-label'), { opacity: 1, scale: 1, y: 0 })
      gsap.set(q('.cursor'), { opacity: 0 })
      setReadout(s.t)
    }
    finalize.current = finalState
    if (reduced) {
      finalState()
      onPlaying?.(false)
      return
    }
    const proxy = { t: 0 }
    const x0 = geo.x(0)
    const t = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onStart: () => onPlaying?.(true),
      onComplete: () => {
        onPlaying?.(false)
        gsap.to(q('.cursor'), { opacity: 0, duration: 0.3 })
      },
    })
    t.set(q('.clip-yield'), { attr: { width: x0 } })
      .set(q('.clip-flow'), { attr: { width: x0 } })
      .set(q('.area, .flow, .end-dot, .end-label, .preinf-label'), { opacity: 0 })
      .set(q('.end-dot'), { scale: 0, transformOrigin: '50% 50%' })
      .set(q('.end-label'), { y: 6 })
      .set(q('.preinf'), { scaleX: 0, transformOrigin: '0% 50%', opacity: 1 })
      .set(q('.cursor'), { opacity: 1, x: 0 })
      .add(() => setReadout(0))
      // 1 — pre-infusion: the puck wets, nothing in the cup yet
      .to(q('.preinf'), { scaleX: 1, duration: 0.45, ease: 'power1.inOut' })
      .to(q('.cursor'), { x: geo.x(geo.pi) - x0, duration: 0.45, ease: 'power1.inOut' }, '<')
      .to(q('.preinf-label'), { opacity: 1, duration: 0.3 }, '<0.2')
      // 2 — the pour: reveal the yield curve in step with a time cursor
      .to(
        proxy,
        {
          t: s.t,
          duration: 1.25,
          ease: 'none',
          onUpdate: () => {
            const xt = geo.x(Math.max(proxy.t, geo.pi))
            gsap.set(q('.clip-yield'), { attr: { width: xt } })
            gsap.set(q('.cursor'), { x: xt - x0 })
            setReadout(Math.max(proxy.t, geo.pi))
          },
        },
        '>-0.05',
      )
      .to(q('.area'), { opacity: 1, duration: 0.9, ease: 'power1.out' }, '<0.2')
      // 3 — flow overlay sweeps in after the cup fills
      .add('flow', '>-0.25')
      .to(q('.flow'), { opacity: 1, duration: 0.25 }, 'flow')
      .to(q('.clip-flow'), { attr: { width: W }, duration: 0.6, ease: 'power2.inOut' }, 'flow')
      // 4 — final reading pops
      .to(q('.end-dot'), { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(3)' }, 'flow')
      .to(q('.end-label'), { opacity: 1, y: 0, duration: 0.35 }, 'flow+=0.1')
    tl.current = t
    return () => {
      t.kill()
      finalState()
    }
    // only replay on explicit play requests
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playKey, reduced])

  const endX = g.x(shot.t)
  const endY = g.y(shot.y)
  const labelLeft = endX > W - 140
  return (
    <svg
      ref={root}
      className="chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-labelledby={`${uid}-t ${uid}-d`}
    >
      <title id={`${uid}-t`}>Illustrative shot curve (synthetic)</title>
      <desc id={`${uid}-d`}>
        Synthetic curve: {shot.y} grams over {shot.t} seconds from {shot.d} grams dose. Not a measurement.
      </desc>
      <defs>
        <clipPath id={`${uid}-cy`}>
          <rect className="clip-yield" x="0" y="0" width={W} height={H} />
        </clipPath>
        <clipPath id={`${uid}-cf`}>
          <rect className="clip-flow" x="0" y="0" width={W} height={H} />
        </clipPath>
        <linearGradient id={`${uid}-ga`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e0b07a" stopOpacity=".28" />
          <stop offset="1" stopColor="#e0b07a" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}-gl`} x1="0" x2="1">
          <stop offset="0" stopColor="#f0d7b8" />
          <stop offset=".55" stopColor="#e0b07a" />
          <stop offset="1" stopColor="#a8683a" />
        </linearGradient>
      </defs>
      <rect
        className="preinf"
        x={g.x(0)}
        y={T}
        width={g.x(g.pi) - g.x(0)}
        height={H - T - B}
        fill="#3a2c22"
        rx="4"
      />
      <text className="preinf-label" x={g.x(g.pi / 2)} y={T + 14} textAnchor="middle" fontSize="10" fill="#d5cbbf">
        pre-inf.
      </text>
      {g.yTicks.map((v) => (
        <g key={'y' + v}>
          <line x1={L} x2={W - R} y1={g.y(v)} y2={g.y(v)} stroke="#3a332c" />
          <text x={L - 8} y={g.y(v) + 4} textAnchor="end" fontSize="11" fill="#d5cbbf">
            {v}g
          </text>
        </g>
      ))}
      {g.xTicks.map((t) => (
        <text key={'x' + t} x={g.x(t)} y={H - B + 18} textAnchor="middle" fontSize="11" fill="#d5cbbf">
          {t}s
        </text>
      ))}
      <g clipPath={`url(#${uid}-cy)`}>
        <path className="area" d={g.areaPath} fill={`url(#${uid}-ga)`} />
        <path
          className="yield"
          d={g.yieldPath}
          fill="none"
          stroke={`url(#${uid}-gl)`}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <g clipPath={`url(#${uid}-cf)`}>
        <path className="flow" d={g.flowPath} fill="none" stroke="#e0b07a" strokeWidth="2" strokeDasharray="5 5" />
      </g>
      <g className="cursor" aria-hidden="true">
        <line x1={g.x(0)} x2={g.x(0)} y1={T} y2={H - B} stroke="#f4efe8" strokeOpacity=".45" strokeDasharray="2 4" />
        <circle cx={g.x(0)} cy={H - B} r="3.5" fill="#f4efe8" />
      </g>
      <circle className="end-dot" cx={endX} cy={endY} r="6" fill="#f4efe8" stroke="#2a2118" strokeWidth="2.5" />
      <text
        className="end-label"
        x={labelLeft ? endX - 12 : endX + 12}
        y={endY - 12}
        textAnchor={labelLeft ? 'end' : 'start'}
        fontSize="12.5"
        fontWeight="650"
        fill="#f4efe8"
      >
        {shot.y}g @ {shot.t}s
      </text>
      <text className="pour-readout" x={W - R} y={T + 12} textAnchor="end" fontSize="12" fill="#f4efe8" aria-hidden="true">
        {`${fmt(shot.y)} g · ${shot.t.toFixed(1)} s`}
      </text>
      <text x={W - R} y={H - 6} textAnchor="end" fontSize="10" letterSpacing=".08em" fill="#d5cbbf">
        SYNTHETIC · ILLUSTRATIVE ONLY
      </text>
    </svg>
  )
}
