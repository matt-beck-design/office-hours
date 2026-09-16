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
      <div className="page-column">
        <div className="cluster" style={{ gap: 16 }}>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-4 animate-pulse"
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

      <div className="page-column">
        <div
          className="flex items-baseline justify-between"
          style={{ gap: 24, marginBottom: 40 }}
        >
          <div className="flex overflow-x-auto" style={{ gap: 28, scrollbarWidth: 'none' }}>
            <TextFilter active={filter === 'all'} onClick={() => setFilter('all')} label="All" />
            {RELEASE_KINDS.map((k) => (
              <TextFilter
                key={k}
                active={filter === k}
                onClick={() => setFilter(k)}
                label={kindLabel(k)}
              />
            ))}
          </div>
          <button type="button" onClick={() => setForm({ release_date: today })} style={textAction}>
            Add
          </button>
        </div>

        {upcoming.length === 0 ? (
          <p className="type-body" style={{ margin: '0 0 40px' }}>
            Nothing coming up. Add a release to start tracking.
          </p>
        ) : (
          <div className="row-stack">
            {upcoming.map((r) => (
              <ReleaseRow key={r.id} release={r} today={today} onOpen={() => setForm(r)} />
            ))}
          </div>
        )}

        {past.length > 0 && (
          <div style={{ marginTop: 'var(--space-section)' }}>
            <button type="button" onClick={() => setShowPast((v) => !v)} style={textAction}>
              {showPast ? 'Hide past' : `Past (${past.length})`}
            </button>
            {showPast && (
              <div className="row-stack" style={{ marginTop: 28 }}>
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
      <p className="type-meta" style={{ margin: 0 }}>
        {whenLabel(release.release_date, today)}
      </p>
      <p className="type-title" style={{ marginTop: 'var(--space-tight)' }}>
        {release.title}
      </p>
      <p className="type-meta">
        {kindLabel(release.kind)}
        {release.notes ? ` ${release.notes}` : ''}
      </p>
    </button>
  )
}

function TextFilter({
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
      className="type-nav"
      style={{
        flexShrink: 0,
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        color: active ? 'var(--foreground)' : 'var(--muted)',
      }}
    >
      {label}
    </button>
  )
}

const textAction: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--muted)',
  cursor: 'pointer',
  padding: 0,
  flexShrink: 0,
  fontSize: 13,
  lineHeight: 1.4,
}
