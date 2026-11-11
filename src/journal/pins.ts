import type { Visit } from './types'

/** Selected pins use the full photo so the pin and the card are the same picture. */
export function pinImageSrc(v: Pick<Visit, 'photo' | 'thumb'>, selected: boolean): string | undefined {
  if (selected) return v.photo || v.thumb
  return v.thumb || v.photo
}

export function cardImageSrc(v: Pick<Visit, 'photo' | 'thumb'>): string | undefined {
  return v.photo || v.thumb
}
