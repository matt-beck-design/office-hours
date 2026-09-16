export const RELEASE_KINDS = ['game', 'movie', 'show', 'music', 'other'] as const

export type ReleaseKind = (typeof RELEASE_KINDS)[number]

export interface Release {
  id: string
  title: string
  kind: ReleaseKind
  release_date: string
  url: string | null
  notes: string | null
  created_at?: string
}

export function isReleaseKind(value: unknown): value is ReleaseKind {
  return typeof value === 'string' && (RELEASE_KINDS as readonly string[]).includes(value)
}

export function kindLabel(kind: ReleaseKind): string {
  switch (kind) {
    case 'game':
      return 'Game'
    case 'movie':
      return 'Movie'
    case 'show':
      return 'Show'
    case 'music':
      return 'Music'
    case 'other':
      return 'Other'
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

export function todayDateStr(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return todayDateStr(d)
}

export function whenLabel(dateStr: string, today: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const stamp = `${weekday} ${formatted}`

  if (dateStr === today) return `Today ${stamp}`
  if (dateStr === addDays(today, 1)) return `Tomorrow ${stamp}`

  const diff = Math.round((date.getTime() - new Date(today + 'T12:00:00').getTime()) / 86400000)
  if (diff > 0 && diff < 14) return `In ${diff} days ${stamp}`
  return stamp
}
