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

/** Built once. Tiger-striped crema from value noise — an illustration, not a fluid sim. */
function buildCrema() {
  if (crema) return crema
  const s = 256
  const canvas = document.createElement('canvas')
  canvas.width = s
  canvas.height = s
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const n1 = noiseGrid(mulberry32(0xc0ffee), 8)
  const n2 = noiseGrid(mulberry32(0x51a7), 8)
  const img = ctx.createImageData(s, s)
  const c0 = [42, 22, 12]
  const c1 = [112, 58, 26]
  const c2 = [176, 104, 48]
  const c3 = [226, 184, 118]
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const u = x / s
      const v = y / s
      const w1 = n1(u * 3.1, v * 3.1)
      const w2 = n2(u * 2.4 + 3.2, v * 2.4 + 1.4)
      const uu = u + (w1 - 0.5) * 0.2
      const vv = v + (w2 - 0.5) * 0.2
      const stripe = Math.sin((uu * 2.2 + vv * 9.2 + w1 * 3.1) * Math.PI)
      const fine = n1(uu * 6.5 + 1.7, vv * 6.5 + 0.6)
      let t = 0.5 + stripe * 0.18 + (fine - 0.5) * 0.26 + (w2 - 0.5) * 0.1
      t = Math.min(1, Math.max(0, t))
      const col =
        t < 0.34 ? mix(c0, c1, t / 0.34) : t < 0.72 ? mix(c1, c2, (t - 0.34) / 0.38) : mix(c2, c3, (t - 0.72) / 0.28)
      const dx = u - 0.42
      const dy = v - 0.38
      const centre = Math.max(0, 1 - Math.hypot(dx, dy) * 2.15)
      const i = (y * s + x) * 4
      img.data[i] = col[0] + centre * 16
      img.data[i + 1] = col[1] + centre * 12
      img.data[i + 2] = col[2] + centre * 6
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const bubbles = mulberry32(7)
  for (let i = 0; i < 14; i++) {
    ctx.beginPath()
    ctx.fillStyle = `rgba(255,236,214,${0.12 + bubbles() * 0.22})`
    ctx.arc(36 + bubbles() * 180, 36 + bubbles() * 180, 0.8 + bubbles() * 2.2, 0, Math.PI * 2)
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
  ctx.translate(cx, cy)
  ctx.rotate(swirl)
  const cover = inner * 2.35
  ctx.drawImage(tex, -cover / 2, -cover / 2, cover, cover)
  ctx.restore()
  const vig = ctx.createRadialGradient(cx - inner * 0.12, cy - inner * 0.18, radius * 0.2, cx, cy, radius)
  vig.addColorStop(0, 'rgba(255,214,160,0.06)')
  vig.addColorStop(0.62, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(18,8,4,0.62)')
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
