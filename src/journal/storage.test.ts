import { describe, expect, it } from 'vitest'
import { googleMapsUrl } from './storage'

describe('Google Maps links', () => {
  it('uses coordinates for seeded cafés and the typed area for your own', () => {
    const demo = googleMapsUrl({ name: 'Kiln', area: 'Hackney', lat: 51.5465, lng: -0.0553, demo: true })
    expect(demo).toContain(encodeURIComponent('51.54650,-0.05530'))
    const yours = googleMapsUrl({ name: 'Corner', area: 'Leith', lat: 55.9, lng: -3.1, demo: false })
    expect(yours).toContain(encodeURIComponent('Corner, Leith'))
    const pinOnly = googleMapsUrl({ name: 'Corner', area: '  ', lat: 55.9, lng: -3.1, demo: false })
    expect(pinOnly).toContain('55.90000')
  })
})