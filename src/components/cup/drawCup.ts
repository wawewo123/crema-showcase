export type CupFrame = { fill: number; swirl: number; light: number }

let crema: HTMLCanvasElement | null = null

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function noiseGrid(rand: () => number, n: number) {
  const g = new Float32Array(n * n)
  for (let i = 0; i < g.length; i++) g[i] = rand()
  return (x: number, y: number) => {
    const x0 = Math.floor(x) % n
    const y0 = Math.floor(y) % n
    const x1 = (x0 + 1) % n
    const y1 = (y0 + 1) % n
    const sx = x - Math.floor(x)
    const sy = y - Math.floor(y)
    const u = sx * sx * (3 - 2 * sx)
    const v = sy * sy * (3 - 2 * sy)
    const at = (ix: number, iy: number) => g[iy * n + ix]
    const a = at(x0, y0) * (1 - u) + at(x1, y0) * u
    const b = at(x0, y1) * (1 - u) + at(x1, y1) * u
    return a * (1 - v) + b * v
  }
}

function mix(a: number[], b: number[], t: number) {
  return a.map((v, i) => v + (b[i] - v) * t)
}

function fbm(noise: (x: number, y: number) => number, x: number, y: number) {
  let amp = 0.5
  let sum = 0
  let value = 0
  let f = 1
  for (let i = 0; i < 5; i++) {
    value += amp * noise(x * f, y * f)
    sum += amp
    f *= 2
    amp *= 0.5
  }
  return value / sum
}

/** Built once. Fine crema marbling — an illustration, not a fluid sim. */
function buildCrema() {
  if (crema) return crema
  const s = 480
  const canvas = document.createElement('canvas')
  canvas.width = s
  canvas.height = s
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const n1 = noiseGrid(mulberry32(0xc0ffee), 16)
  const n2 = noiseGrid(mulberry32(0x51a7), 16)
  const img = ctx.createImageData(s, s)
  const c0 = [62, 32, 16]
  const c1 = [128, 68, 30]
  const c2 = [176, 108, 52]
  const c3 = [214, 168, 104]
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const u = x / s
      const v = y / s
      const dx = u - 0.5
      const dy = v - 0.48
      const rad = Math.hypot(dx, dy)
      const ang = Math.atan2(dy, dx)
      const warp = fbm(n1, u * 4.5, v * 4.5)
      const curl = ang * 3.2 + rad * 28 + warp * 5.5
      const streak = Math.sin(curl) * 0.55 + Math.sin(curl * 2.15 + 1.3) * 0.25
      const mottled = fbm(n2, u * 9 + warp, v * 9)
      const grain = n1(u * 48, v * 48)
      let t = 0.56 + streak * 0.07 + (mottled - 0.5) * 0.22 + (grain - 0.5) * 0.16 - rad * 0.22
      t = Math.min(1, Math.max(0, t))
      const col = t < 0.4 ? mix(c0, c1, t / 0.4) : t < 0.75 ? mix(c1, c2, (t - 0.4) / 0.35) : mix(c2, c3, (t - 0.75) / 0.25)
      const i = (y * s + x) * 4
      img.data[i] = col[0]
      img.data[i + 1] = col[1]
      img.data[i + 2] = col[2]
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const bubbles = mulberry32(7)
  for (let i = 0; i < 36; i++) {
    const px = 48 + bubbles() * (s - 96)
    const py = 48 + bubbles() * (s - 96)
    const rad = 0.7 + bubbles() * 1.6
    ctx.beginPath()
    ctx.fillStyle = `rgba(255, 236, 214, ${0.18 + bubbles() * 0.28})`
    ctx.arc(px, py, rad, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.fillStyle = 'rgba(90, 48, 22, 0.18)'
    ctx.arc(px + rad * 0.3, py + rad * 0.35, rad * 0.45, 0, Math.PI * 2)
    ctx.fill()
  }
  crema = canvas
  return canvas
}

export function drawCup(ctx: CanvasRenderingContext2D, size: number, frame: CupFrame) {
  const { fill, swirl, light } = frame
  ctx.clearRect(0, 0, size, size)
  const cx = size / 2
  const cy = size / 2
  const outer = size * 0.46
  const inner = outer * 0.8

  ctx.save()
  ctx.translate(cx, cy + outer * 0.9)
  ctx.scale(1, 0.22)
  ctx.beginPath()
  ctx.fillStyle = 'rgba(0,0,0,0.38)'
  ctx.arc(0, 0, outer, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  const body = ctx.createRadialGradient(cx - outer * 0.38, cy - outer * 0.42, outer * 0.1, cx, cy, outer)
  body.addColorStop(0, '#fbf7f1')
  body.addColorStop(0.5, '#e7e0d4')
  body.addColorStop(1, '#c2b6a6')
  ctx.beginPath()
  ctx.fillStyle = body
  ctx.arc(cx, cy, outer, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.fillStyle = '#140c09'
  ctx.arc(cx, cy, inner + 1.5, 0, Math.PI * 2)
  ctx.fill()

  const radius = inner * (0.16 + 0.84 * Math.min(1, Math.max(0, fill)))
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.clip()
  ctx.fillStyle = '#24140e'
  ctx.fillRect(0, 0, size, size)
  const tex = buildCrema()
  ctx.save()
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.translate(cx, cy)
  ctx.rotate(swirl)
  const cover = inner * 2.05
  ctx.drawImage(tex, -cover / 2, -cover / 2, cover, cover)
  ctx.restore()
  const vig = ctx.createRadialGradient(cx - inner * 0.08, cy - inner * 0.12, radius * 0.25, cx, cy, radius)
  vig.addColorStop(0, 'rgba(255,220,176,0.05)')
  vig.addColorStop(0.72, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(28,12,6,0.38)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, size, size)
  const wash = Math.min(0.2, Math.max(0, (light - 0.92) * 0.65))
  ctx.fillStyle = `rgba(255, 206, 150, ${wash})`
  ctx.fillRect(0, 0, size, size)
  ctx.beginPath()
  ctx.fillStyle = 'rgba(255,255,255,0.13)'
  ctx.ellipse(cx - inner * 0.28, cy - inner * 0.32, inner * 0.2, inner * 0.09, -0.7, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.beginPath()
  ctx.lineWidth = Math.max(2.5, size * 0.028)
  const rim = ctx.createLinearGradient(cx - outer, cy - outer, cx + outer, cy + outer)
  rim.addColorStop(0, '#ffffff')
  rim.addColorStop(0.4, '#f0e8dc')
  rim.addColorStop(1, '#a89886')
  ctx.strokeStyle = rim
  ctx.arc(cx, cy, inner, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.lineWidth = Math.max(1, size * 0.007)
  ctx.strokeStyle = 'rgba(28,16,10,0.65)'
  ctx.arc(cx, cy, inner - size * 0.012, 0, Math.PI * 2)
  ctx.stroke()
}
