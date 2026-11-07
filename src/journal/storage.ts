import type { Visit } from './types'

export const newId = () => 'v-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

export function googleMapsUrl(v: Pick<Visit, 'name' | 'area' | 'lat' | 'lng' | 'demo'>) {
  // Fictional demo cafés would not resolve by name, so demos (and entries without an address) use coordinates.
  const q = !v.demo && v.area.trim() ? `${v.name}, ${v.area}` : `${v.lat.toFixed(5)},${v.lng.toFixed(5)}`
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q)
}

function draw(img: HTMLImageElement, max: number, quality: number) {
  const scale = Math.min(1, max / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(img, 0, 0, w, h)
  return c.toDataURL('image/jpeg', quality)
}

/** Shrinks a user photo so one picture does not fill the browser. Returns the full frame and a thumb of the same image. */
export function resizePhoto(file: File, max = 1080, thumbMax = 160, quality = 0.82): Promise<{ photo: string; thumb: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      try {
        const photo = draw(img, max, quality)
        const thumb = draw(img, thumbMax, 0.72)
        URL.revokeObjectURL(url)
        resolve({ photo, thumb })
      } catch (err) {
        URL.revokeObjectURL(url)
        reject(err instanceof Error ? err : new Error('Canvas unavailable'))
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('That file could not be read as an image.'))
    }
    img.src = url
  })
}
