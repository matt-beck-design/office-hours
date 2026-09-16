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
      <div className="px-5 py-8 mx-auto" style={{ maxWidth: 'var(--column)' }}>
        <div className="space-y-3">
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

      <div
        className="mx-auto pb-[env(safe-area-inset-bottom)]"
        style={{ maxWidth: 'var(--column)', padding: '32px 24px 48px' }}
      >
        <div className="flex items-center justify-between mb-8" style={{ gap: 24 }}>
          <div className="flex gap-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
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
          <p style={{ color: 'var(--muted)', margin: '0 0 32px' }}>
            Nothing coming up. Add a release to start tracking.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcoming.map((r) => (
              <ReleaseRow key={r.id} release={r} today={today} onOpen={() => setForm(r)} />
            ))}
          </div>
        )}

        {past.length > 0 && (
          <div style={{ marginTop: 64 }}>
            <button type="button" onClick={() => setShowPast((v) => !v)} style={textAction}>
              {showPast ? 'Hide past' : `Past (${past.length})`}
            </button>
            {showPast && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
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
      <p style={{ color: 'var(--muted)', margin: '0 0 8px' }}>
        {whenLabel(release.release_date, today)}
      </p>
      <p style={{ color: 'var(--foreground)', margin: '0 0 8px' }}>{release.title}</p>
      <p style={{ color: 'var(--muted)', margin: 0 }}>
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
}
