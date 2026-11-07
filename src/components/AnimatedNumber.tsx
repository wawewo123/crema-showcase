import { animate, useReducedMotion } from 'framer-motion'
import { useEffect, useRef } from 'react'

type Props = { value: number; format: (n: number) => string; className?: string }

/** Tweens between values instead of snapping; text is written straight to the DOM node (no re-render per frame). */
export function AnimatedNumber({ value, format, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const from = useRef(value)
  const reduce = useReducedMotion()
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduce) {
      el.textContent = format(value)
      from.current = value
      return
    }
    const controls = animate(from.current, value, {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = format(v)
        from.current = v
      },
    })
    return () => controls.stop()
  }, [value, format, reduce])
  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  )
}
