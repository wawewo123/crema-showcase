// One place to swap the basemap. No API key needed for this default.
// OpenStreetMap's standard tiles are free for light, non-heavy use under the OSM tile usage policy
// (https://operations.osmfoundation.org/policies/tiles/) and require the attribution below.
// Note: CARTO's basemaps were tried first, but in Nov 2026 they served "API KEY REQUIRED" tiles without a key.
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
export const TILE_MAX_ZOOM = 19
