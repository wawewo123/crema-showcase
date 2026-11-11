import { LIMITS, type Shot } from '../lib/brew'

const START = (128 * Math.PI) / 180
const SWEEP = (246 * Math.PI) / 180
const R = 47

function polar(angle: number, radius: number) {
  return { x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) }
}

export function RingGauge({ shot }: { shot: Shot }) {
  const timeFrac = (shot.t - LIMITS.t.min) / (LIMITS.t.max - LIMITS.t.min)
  const yieldFrac = (shot.y - LIMITS.y.min) / (LIMITS.y.max - LIMITS.y.min)
  const a0 = START
  const a1 = START + SWEEP * Math.max(0.04, timeFrac)
  const yAngle = START + SWEEP * yieldFrac
  const p0 = polar(a0, R)
  const p1 = polar(a1, R)
  const large = a1 - a0 > Math.PI ? 1 : 0
  const timeLabel = polar(a1, R + 9)
  const close = Math.abs(timeFrac - yieldFrac) < 0.12
  const yieldLabel = polar(yAngle, R + (close ? 16 : 9))
  const dot = polar(yAngle, R)
  const d = `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`
  const label = `Gauge. Time ${shot.t} seconds, shown as the amber arc. Yield ${shot.y} grams, shown as the light dot. Illustration only.`

  return (
    <svg className="ring" viewBox="-6 -6 112 112" role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
      <circle cx="50" cy="50" r={R} fill="none" stroke="#3a332c" strokeWidth="0.9" />
      <path d={d} fill="none" stroke="#e0b07a" strokeWidth="2.15" strokeLinecap="round" />
      <circle cx={dot.x} cy={dot.y} r="1.7" fill="#f4efe8" />
      <text x={timeLabel.x} y={timeLabel.y} textAnchor="middle" dominantBaseline="middle" fill="#d5cbbf" fontSize="4.3">
        Time
      </text>
      <text x={yieldLabel.x} y={yieldLabel.y} textAnchor="middle" dominantBaseline="middle" fill="#d5cbbf" fontSize="4.3">
        Yield
      </text>
    </svg>
  )
}
