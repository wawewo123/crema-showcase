import { describe, expect, it } from 'vitest'
import { cardImageSrc, pinImageSrc } from './pins'

describe('pin and card photos', () => {
  it('uses the same full photo for the selected pin and the card', () => {
    const visit = { photo: 'data:image/jpeg;base64,full', thumb: 'data:image/jpeg;base64,small' }
    expect(pinImageSrc(visit, true)).toBe(cardImageSrc(visit))
    expect(pinImageSrc(visit, false)).toBe(visit.thumb)
  })

  it('falls back to whichever encode exists', () => {
    expect(pinImageSrc({ photo: 'only' }, true)).toBe('only')
    expect(cardImageSrc({ thumb: 'only-thumb' })).toBe('only-thumb')
    expect(pinImageSrc({}, true)).toBeUndefined()
  })
})
