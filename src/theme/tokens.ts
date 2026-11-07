export const tokens = {
  bg: '#14110f',
  bgDeep: '#0c0a09',
  surface: '#1c1814',
  text: '#f4efe8',
  label: '#d5cbbf',
  muted: '#b7aa9c',
  amber: '#e0b07a',
  cream: '#f0d7b8',
  creamText: '#2a2118',
  chipOn: '#f3e6d4',
  line: '#3a332c',
} as const

function channel(hex: string, i: number) {
  const c = parseInt(hex.slice(i, i + 2), 16) / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function contrastRatio(fg: string, bg: string) {
  const lum = (hex: string) => {
    const h = hex.replace('#', '')
    const r = channel(h, 0)
    const g = channel(h, 2)
    const b = channel(h, 4)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const a = lum(fg)
  const b = lum(bg)
  const hi = Math.max(a, b)
  const lo = Math.min(a, b)
  return (hi + 0.05) / (lo + 0.05)
}
