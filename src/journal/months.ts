import type { Visit } from './types'

export function monthKey(date: string): string {
  return date.slice(0, 7)
}

export function monthLabel(key: string): string {
  const d = new Date(key + '-01T12:00:00Z')
  if (Number.isNaN(d.getTime())) return key
  return d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })
}

export function monthTicks(visits: Visit[]): { key: string; label: string }[] {
  const keys = [...new Set(visits.map((v) => monthKey(v.date)).filter((k) => /^\d{4}-\d{2}$/.test(k)))].sort()
  return [{ key: 'all', label: 'All' }, ...keys.map((key) => ({ key, label: monthLabel(key) }))]
}

export function filterByMonth(visits: Visit[], key: string): Visit[] {
  if (key === 'all') return visits
  return visits.filter((v) => monthKey(v.date) === key)
}
