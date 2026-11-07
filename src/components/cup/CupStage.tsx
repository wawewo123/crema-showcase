import { useEffect, useRef, useState } from 'react'
import { LIMITS } from '../../lib/brew'
import { cremaLightness, pourFill, shouldRunCupLoop } from './policy'
import { drawCup } from './drawCup'

type Props = {
  active: boolean
  reduced: boolean
  playKey: number
  yieldG: number
  onPlaying?: (playing: boolean) => void
}

function CupFallback() {
  return (
    <svg className="cup-fallback" viewBox="0 0 200 200" aria-hidden="true">
      <ellipse cx="100" cy="168" rx="62" ry="10" fill="rgba(0,0,0,.35)" />
      <circle cx="100" cy="96" r="78" fill="#e7e0d4" />
      <circle cx="100" cy="96" r="62" fill="#140c09" />
      <circle cx="100" cy="96" r="58" fill="#8a4e28" />
      <ellipse cx="86" cy="78" rx="18" ry="8" fill="rgba(255,255,255,.16)" transform="rotate(-30 86 78)" />
      <circle cx="100" cy="96" r="62" fill="none" stroke="#f4efe8" strokeWidth="5" />
    </svg>
  )
}

export function CupStage({ active, reduced, playKey, yieldG, onPlaying }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lightRef = useRef(1)
  const playingRef = useRef(false)
  const [fallback, setFallback] = useState(false)
  const [visible, setVisible] = useState(true)
  const [pageHidden, setPageHidden] = useState(() => typeof document !== 'undefined' && document.hidden)
  const [mode, setMode] = useState<'live' | 'still'>('still')
  const [size, setSize] = useState(0)
  lightRef.current = cremaLightness(yieldG, LIMITS.y.min, LIMITS.y.max)

  const report = (playing: boolean) => {
    if (playingRef.current === playing) return
    playingRef.current = playing
    onPlaying?.(playing)
  }

  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.08 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const on = () => setPageHidden(document.hidden)
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setSize(canvas.clientWidth))
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setFallback(true)
      setMode('still')
      report(false)
      return
    }
    setFallback(false)
    let raf = 0
    let stopped = false
    const live = () =>
      shouldRunCupLoop({
        active,
        visible,
        reduced,
        canvas: true,
        hidden: pageHidden,
      })

    const paint = (fill: number, swirl: number) => {
      const css = canvas.clientWidth
      if (!css) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const px = Math.max(1, Math.round(css * dpr))
      if (canvas.width !== px) {
        canvas.width = px
        canvas.height = px
      }
      drawCup(ctx, px, { fill, swirl, light: lightRef.current })
    }

    if (!live()) {
      paint(1, 0)
      setMode('still')
      report(false)
      return () => {
        stopped = true
        cancelAnimationFrame(raf)
      }
    }

    const started = performance.now()
    setMode('live')
    const frame = (now: number) => {
      if (stopped) return
      if (!live()) {
        paint(1, 0)
        setMode('still')
        report(false)
        return
      }
      const fill = pourFill(now - started)
      paint(fill, Math.sin(now / 1000 * 0.32) * 0.045)
      report(fill < 0.999)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      report(false)
    }
    // light is read from a ref so dragging yield does not restart the pour
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, visible, reduced, playKey, pageHidden, size])

  useEffect(() => {
    if (mode === 'live') return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !canvas.clientWidth) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const px = Math.max(1, Math.round(canvas.clientWidth * dpr))
    if (canvas.width !== px) {
      canvas.width = px
      canvas.height = px
    }
    drawCup(ctx, px, { fill: 1, swirl: 0, light: lightRef.current })
  }, [yieldG, mode])

  return (
    <div className="hero-cup" ref={wrapRef} data-cup-mode={mode} data-testid="cup-stage">
      {fallback ? <CupFallback /> : <canvas ref={canvasRef} className="cup-canvas" width={400} height={400} aria-hidden="true" />}
    </div>
  )
}
