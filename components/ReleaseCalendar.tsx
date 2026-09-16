'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import ReleaseForm from './ReleaseForm'
import {
  Release,
  RELEASE_KINDS,
  ReleaseKind,
  kindLabel,
  todayDateStr,
} from '@/lib/releases'

type KindFilter = 'all' | ReleaseKind

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function ReleaseCalendar() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<KindFilter>('all')
  const [form, setForm] = useState<Partial<Release> & { release_date: string } | null>(null)

  const today = todayDateStr()

  useEffect(() => {
    fetch('/api/releases')
      .then((r) => r.json())
      .then((data) => {
        setReleases(data.releases ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () => (filter === 'all' ? releases : releases.filter((r) => r.kind === filter)),
    [releases, filter],
  )

  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startWeekday = new Date(year, month, 1).getDay()

  const byDate = useMemo(() => {
    const map = new Map<string, Release[]>()
    for (const r of filtered) {
      const list = map.get(r.release_date) ?? []
      list.push(r)
      map.set(r.release_date, list)
    }
    return map
  }, [filtered])

  const monthReleases = filtered
    .filter((r) => r.release_date.startsWith(monthKey))
    .sort((a, b) => a.release_date.localeCompare(b.release_date) || a.title.localeCompare(b.title))

  const upcoming = monthReleases.filter((r) => r.release_date >= today)
  const released = monthReleases.filter((r) => r.release_date < today)

  const comingSoon = useMemo(() => {
    const end = addDays(today, 90)
    return filtered
      .filter((r) => r.release_date >= today && r.release_date <= end)
      .sort((a, b) => a.release_date.localeCompare(b.release_date) || a.title.localeCompare(b.title))
  }, [filtered, today])

  function shiftMonth(delta: number) {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  function upsert(release: Release) {
    setReleases((prev) => {
      const without = prev.filter((r) => r.id !== release.id)
      return [...without, release]
    })
    setForm(null)
  }

  function remove(id: string) {
    setReleases((prev) => prev.filter((r) => r.id !== id))
    setForm(null)
  }

  if (loading) {
    return (
      <div className="px-5 py-8 mx-auto" style={{ maxWidth: '576px' }}>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-4 rounded animate-pulse"
              style={{ background: 'var(--border)', width: `${60 + (i % 3) * 15}%` }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {form && (
        <ReleaseForm
          initial={form}
          onClose={() => setForm(null)}
          onSaved={upsert}
          onDeleted={remove}
        />
      )}

      <div
        className="mx-auto pb-[env(safe-area-inset-bottom)]"
        style={{ maxWidth: '576px', padding: '20px 16px 32px' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month" style={navBtn}>
              ←
            </button>
            <h1
              className="text-base font-medium"
              style={{ margin: 0, minWidth: 160, textAlign: 'center', cursor: 'pointer' }}
              onClick={() => {
                const n = new Date()
                setYear(n.getFullYear())
                setMonth(n.getMonth())
              }}
            >
              {new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h1>
            <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month" style={navBtn}>
              →
            </button>
          </div>
          <button
            type="button"
            onClick={() => setForm({ release_date: todayInMonth(year, month, today) })}
            style={addBtn}
          >
            Add
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto mb-5" style={{ scrollbarWidth: 'none' }}>
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="All" />
          {RELEASE_KINDS.map((k) => (
            <FilterChip
              key={k}
              active={filter === k}
              onClick={() => setFilter(k)}
              label={kindLabel(k)}
            />
          ))}
        </div>

        <div className="cal-grid mb-6">
          {WEEKDAYS.map((d) => (
            <div key={d} className="cal-dow">
              {d}
            </div>
          ))}
          {Array.from({ length: startWeekday }, (_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const dateStr = `${monthKey}-${String(day).padStart(2, '0')}`
            const items = byDate.get(dateStr) ?? []
            const isToday = dateStr === today
            return (
              <button
                key={dateStr}
                type="button"
                className="cal-day"
                data-today={isToday ? 'true' : undefined}
                onClick={() => setForm({ release_date: dateStr })}
                aria-label={`${formatLong(dateStr)}${items.length ? `, ${items.length} releases` : ''}`}
              >
                <span>{day}</span>
                {items.length > 0 && (
                  <span className="cal-dots">
                    {items.slice(0, 3).map((item) => (
                      <span key={item.id} className="cal-dot" />
                    ))}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {isCurrentMonth(year, month, today) && comingSoon.length > 0 && (
          <section className="mb-8">
            <SectionLabel>Coming soon</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {comingSoon.map((r) => (
                <ReleaseRow key={r.id} release={r} today={today} onOpen={() => setForm(r)} />
              ))}
            </div>
          </section>
        )}

        {(!isCurrentMonth(year, month, today) || comingSoon.length === 0) && (
          <section className="mb-8">
            <SectionLabel>
              {upcoming.length > 0 ? 'This month' : released.length > 0 ? 'Released' : 'This month'}
            </SectionLabel>
            {monthReleases.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted)', margin: 0 }}>
                Nothing on the calendar this month.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {(upcoming.length > 0 ? upcoming : released).map((r) => (
                  <ReleaseRow key={r.id} release={r} today={today} onOpen={() => setForm(r)} />
                ))}
              </div>
            )}
          </section>
        )}

        {isCurrentMonth(year, month, today) && released.length > 0 && (
          <section>
            <SectionLabel>Already out</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {released.map((r) => (
                <ReleaseRow key={r.id} release={r} today={today} onOpen={() => setForm(r)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}

function ReleaseRow({
  release,
  today,
  onOpen,
}: {
  release: Release
  today: string
  onOpen: () => void
}) {
  return (
    <button type="button" onClick={onOpen} className="digest-item w-full text-left" style={{ padding: '14px 12px' }}>
      <p className="font-medium leading-snug" style={{ margin: '0 0 4px', fontSize: 16 }}>
        {release.title}
      </p>
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
        {kindLabel(release.kind)}
        <span style={{ margin: '0 6px', opacity: 0.5 }}>·</span>
        {whenLabel(release.release_date, today)}
      </p>
      {release.notes && (
        <p className="line-clamp-2" style={{ fontSize: 13, color: 'var(--muted)', margin: '6px 0 0' }}>
          {release.notes}
        </p>
      )}
    </button>
  )
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flexShrink: 0,
        padding: '6px 12px',
        fontSize: 13,
        fontWeight: 500,
        borderRadius: 999,
        cursor: 'pointer',
        border: '1px solid var(--border)',
        background: active ? 'var(--foreground)' : 'transparent',
        color: active ? 'var(--background)' : 'var(--muted)',
      }}
    >
      {label}
    </button>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        margin: '0 0 8px',
        padding: '0 12px',
      }}
    >
      {children}
    </p>
  )
}

function isCurrentMonth(year: number, month: number, today: string): boolean {
  return today.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)
}

function todayInMonth(year: number, month: number, today: string): string {
  if (isCurrentMonth(year, month, today)) return today
  return `${year}-${String(month + 1).padStart(2, '0')}-01`
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return todayDateStr(d)
}

function formatLong(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function whenLabel(dateStr: string, today: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (dateStr === today) return `Today · ${formatted}`
  const tomorrow = addDays(today, 1)
  if (dateStr === tomorrow) return `Tomorrow · ${formatted}`
  if (dateStr < today) return formatted

  const diff = Math.round((date.getTime() - new Date(today + 'T12:00:00').getTime()) / 86400000)
  if (diff < 14) return `In ${diff} days · ${formatted}`
  return formatted
}

const navBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--foreground)',
  cursor: 'pointer',
  fontSize: 18,
  lineHeight: 1,
  padding: '4px 0',
}

const addBtn: React.CSSProperties = {
  background: 'var(--foreground)',
  color: 'var(--background)',
  border: 'none',
  borderRadius: 8,
  padding: '8px 14px',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  minHeight: 36,
}
