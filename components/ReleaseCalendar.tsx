'use client'

import { useEffect, useState } from 'react'
import ReleaseForm from './ReleaseForm'
import {
  Release,
  RELEASE_KINDS,
  ReleaseKind,
  kindLabel,
  todayDateStr,
  whenLabel,
} from '@/lib/releases'

type KindFilter = 'all' | ReleaseKind

export default function ReleaseCalendar() {
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<KindFilter>('all')
  const [showPast, setShowPast] = useState(false)
  const [form, setForm] = useState<(Partial<Release> & { release_date: string }) | null>(null)

  const today = todayDateStr()
  const filtered = filter === 'all' ? releases : releases.filter((r) => r.kind === filter)
  const upcoming = filtered
    .filter((r) => r.release_date >= today)
    .sort((a, b) => a.release_date.localeCompare(b.release_date) || a.title.localeCompare(b.title))
  const past = filtered
    .filter((r) => r.release_date < today)
    .sort((a, b) => b.release_date.localeCompare(a.release_date) || a.title.localeCompare(b.title))

  useEffect(() => {
    fetch('/api/releases')
      .then((r) => r.json())
      .then((data) => {
        setReleases(data.releases ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function upsert(release: Release) {
    setReleases((prev) => [...prev.filter((r) => r.id !== release.id), release])
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
              className="h-4 rounded-full animate-pulse"
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
        <div className="flex items-center justify-end mb-5">
          <button type="button" onClick={() => setForm({ release_date: today })} style={addBtn}>
            Add
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto mb-6" style={{ scrollbarWidth: 'none' }}>
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

        {upcoming.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--muted)', margin: '0 0 24px', padding: '0 4px' }}>
            Nothing coming up. Add a release to start tracking.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {upcoming.map((r) => (
              <ReleaseRow key={r.id} release={r} today={today} onOpen={() => setForm(r)} />
            ))}
          </div>
        )}

        {past.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <button type="button" onClick={() => setShowPast((v) => !v)} style={ghostBtn}>
              {showPast ? 'Hide past' : `Past (${past.length})`}
            </button>
            {showPast && (
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: 12 }}>
                {past.map((r) => (
                  <ReleaseRow key={r.id} release={r} today={today} onOpen={() => setForm(r)} />
                ))}
              </div>
            )}
          </div>
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
    <button type="button" onClick={onOpen} className="digest-item w-full text-left">
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 6px' }}>
        {whenLabel(release.release_date, today)}
      </p>
      <p className="font-medium leading-snug" style={{ margin: '0 0 4px' }}>
        {release.title}
      </p>
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
        {kindLabel(release.kind)}
        {release.notes ? ` ${release.notes}` : ''}
      </p>
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
        borderRadius: 'var(--radius)',
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

const addBtn: React.CSSProperties = {
  background: 'var(--foreground)',
  color: 'var(--background)',
  border: 'none',
  borderRadius: 'var(--radius)',
  padding: '8px 14px',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  minHeight: 36,
}

const ghostBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--muted)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  padding: '8px 4px',
}
