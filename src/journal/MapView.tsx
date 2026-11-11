import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import { clusterVisits, type Pin } from './cluster'
import { pinImageSrc } from './pins'
import { TILE_ATTRIBUTION, TILE_MAX_ZOOM, TILE_URL } from './tiles'
import type { Visit } from './types'

type Props = {
  visits: Visit[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  placing: boolean
  draftPin: { lat: number; lng: number } | null
  onPlace: (p: { lat: number; lng: number }) => void
  reduced: boolean
  fitKey: number
  active: boolean
}

const UK_BOUNDS = L.latLngBounds([49.9, -6.5], [58.7, 1.8])

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)

function visitIcon(v: Visit, selected: boolean) {
  const src = pinImageSrc(v, selected)
  const face = src
    ? `<img src="${esc(src)}" alt="" draggable="false"/>`
    : `<span class="ppin-initial">${esc((v.name.trim().charAt(0) || 'C').toUpperCase())}</span>`
  const size = selected ? 76 : 52
  return L.divIcon({
    className: 'ppin-wrap',
    html: `<div class="ppin${selected ? ' is-selected' : ''}" style="width:${size}px;height:${size}px"><div class="ppin-face">${face}</div></div>`,
    iconSize: [size, size + (selected ? 16 : 8)],
    iconAnchor: [size / 2, size + (selected ? 12 : 4)],
  })
}

function clusterIcon(pin: Extract<Pin, { kind: 'cluster' }>) {
  const src = pinImageSrc(pin.visits[0], false)
  const face = src ? `<img src="${esc(src)}" alt="" draggable="false"/>` : ''
  return L.divIcon({
    className: 'ppin-wrap',
    html: `<div class="ppin is-cluster"><div class="ppin-face">${face}</div><span class="ppin-count">${pin.visits.length}</span></div>`,
    iconSize: [56, 64],
    iconAnchor: [28, 60],
  })
}

const draftIcon = L.divIcon({
  className: 'ppin-wrap',
  html: `<div class="ppin is-draft"><div class="ppin-face"><span class="ppin-initial">+</span></div></div>`,
  iconSize: [52, 60],
  iconAnchor: [26, 56],
})

export function MapView({ visits, selectedId, onSelect, placing, draftPin, onPlace, reduced, fitKey, active }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)
  const draft = useRef<L.Marker | null>(null)
  const placingRef = useRef(placing)
  placingRef.current = placing
  const onPlaceRef = useRef(onPlace)
  onPlaceRef.current = onPlace
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const [tiles, setTiles] = useState<'loading' | 'ok' | 'offline'>('loading')
  const [zoom, setZoom] = useState(6)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!el.current || map.current) return
    const m = L.map(el.current, {
      zoomControl: false,
      attributionControl: true,
      zoomSnap: 0.25,
      fadeAnimation: !reduced,
      zoomAnimation: !reduced,
      markerZoomAnimation: !reduced,
    })
    L.control.zoom({ position: 'topright' }).addTo(m)
    m.attributionControl.setPrefix(false)
    let loaded = 0
    let errors = 0
    const tilesLayer = L.tileLayer(TILE_URL, {
      maxZoom: TILE_MAX_ZOOM,
      attribution: TILE_ATTRIBUTION,
    })
    const giveUp = window.setTimeout(() => {
      if (loaded === 0) setTiles('offline')
    }, 2500)
    tilesLayer.on('tileload', () => {
      loaded++
      window.clearTimeout(giveUp)
      setTiles('ok')
    })
    tilesLayer.on('tileerror', () => {
      errors++
      if (loaded === 0 && errors >= 2) setTiles('offline')
    })
    tilesLayer.addTo(m)
    if (typeof navigator !== 'undefined' && navigator.onLine === false) setTiles('offline')
    m.fitBounds(UK_BOUNDS, { animate: false })
    layer.current = L.layerGroup().addTo(m)
    m.on('click', (e: L.LeafletMouseEvent) => {
      if (placingRef.current) onPlaceRef.current({ lat: e.latlng.lat, lng: e.latlng.lng })
      else onSelectRef.current(null)
    })
    m.on('zoomend', () => setZoom(m.getZoom()))
    map.current = m
    setZoom(m.getZoom())
    setReady(true)
    const ro = new ResizeObserver(() => m.invalidateSize())
    ro.observe(el.current)
    return () => {
      window.clearTimeout(giveUp)
      ro.disconnect()
      m.remove()
      map.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (active) map.current?.invalidateSize()
  }, [active])

  useEffect(() => {
    const g = layer.current
    const m = map.current
    if (!g || !m || !ready) return
    g.clearLayers()
    const pins = clusterVisits(visits, zoom, placing ? null : selectedId)
    for (const pin of pins) {
      if (pin.kind === 'visit') {
        const v = pin.visit
        const selected = v.id === selectedId && !placing
        const mk = L.marker([v.lat, v.lng], {
          icon: visitIcon(v, selected),
          title: `${v.name}${v.demo ? ' (demo)' : ''}`,
          alt: v.name,
          keyboard: true,
          zIndexOffset: selected ? 1000 : 0,
        })
        mk.on('click', (e) => {
          L.DomEvent.stopPropagation(e)
          if (placingRef.current) {
            onPlaceRef.current({ lat: e.latlng.lat, lng: e.latlng.lng })
            return
          }
          onSelectRef.current(v.id)
        })
        mk.addTo(g)
      } else {
        const mk = L.marker([pin.lat, pin.lng], {
          icon: clusterIcon(pin),
          title: `${pin.visits.length} places`,
          keyboard: true,
        })
        mk.on('click', (e) => {
          L.DomEvent.stopPropagation(e)
          if (placingRef.current) {
            onPlaceRef.current({ lat: e.latlng.lat, lng: e.latlng.lng })
            return
          }
          const b = L.latLngBounds(pin.visits.map((v) => [v.lat, v.lng] as [number, number]))
          m.flyToBounds(b.pad(0.6), { animate: !reduced, duration: reduced ? 0 : 0.8, maxZoom: Math.min(m.getZoom() + 3, 16) })
        })
        mk.addTo(g)
      }
    }
  }, [visits, selectedId, zoom, ready, placing, reduced])

  useEffect(() => {
    const m = map.current
    if (!m || !ready) return
    if (!visits.length) {
      m.fitBounds(UK_BOUNDS, { animate: !reduced })
      return
    }
    const b = L.latLngBounds(visits.map((v) => [v.lat, v.lng] as [number, number]))
    m.flyToBounds(b.pad(0.3), { animate: !reduced, duration: reduced ? 0 : 0.9, maxZoom: 12 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, ready])

  useEffect(() => {
    const m = map.current
    const v = visits.find((x) => x.id === selectedId)
    if (!m || !v || placing) return
    const z = Math.max(m.getZoom(), 12)
    const size = m.getSize()
    const dy = size.y * 0.18
    const target = m.unproject(m.project([v.lat, v.lng], z).add([0, dy]), z)
    if (reduced) m.setView(target, z, { animate: false })
    else m.flyTo(target, z, { duration: 0.9 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  useEffect(() => {
    const m = map.current
    if (!m) return
    draft.current?.remove()
    draft.current = null
    if (draftPin) draft.current = L.marker([draftPin.lat, draftPin.lng], { icon: draftIcon, interactive: false, zIndexOffset: 1100 }).addTo(m)
  }, [draftPin])

  return (
    <div className={`map-shell tiles-${tiles}${placing ? ' is-placing' : ''}`}>
      <div ref={el} className="map" role="region" aria-label="Map of café visits. The visit list is the keyboard alternative." />
      {tiles === 'offline' && (
        <p className="map-offline" role="status">
          Map tiles need an internet connection. Your pins and the visit list still work.
        </p>
      )}
    </div>
  )
}
