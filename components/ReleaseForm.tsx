'use client'

import { FormEvent, TransitionEvent, useEffect, useState } from 'react'
import { Release, RELEASE_KINDS, ReleaseKind, kindLabel, isReleaseKind } from '@/lib/releases'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 0',
  fontSize: '16px',
  background: 'transparent',
  color: 'var(--foreground)',
  border: 'none',
  borderBottom: '1px solid var(--border)',
  borderRadius: 0,
  outline: 'none',
  minHeight: '44px',
  colorScheme: 'dark',
}

interface Props {
  initial: Partial<Release> & { release_date: string }
  onClose: () => void
  onSaved: (release: Release) => void
  onDeleted?: (id: string) => void
}

export default function ReleaseForm({ initial, onClose, onSaved, onDeleted }: Props) {
  const editing = Boolean(initial.id)
  const [title, setTitle] = useState(initial.title ?? '')
  const [kind, setKind] = useState<ReleaseKind>(initial.kind ?? 'game')
  const [date, setDate] = useState(initial.release_date)
  const [url, setUrl] = useState(initial.url ?? '')
  const [notes, setNotes] = useState(initial.notes ?? '')
  const [password, setPassword] = useState('')
  const [needsAuth, setNeedsAuth] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [closing, setClosing] = useState(false)

  function requestClose() {
    setClosing(true)
  }

  useEffect(() => {
    if (!closing) return
    const timeout = window.setTimeout(onClose, 320)
    return () => window.clearTimeout(timeout)
  }, [closing, onClose])

  function handleTransitionEnd(e: TransitionEvent<HTMLDivElement>) {
    if (!closing) return
    if (e.target !== e.currentTarget) return
    if (e.propertyName !== 'opacity') return
    onClose()
  }

  async function login(): Promise<boolean> {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) {
      setError('Wrong password.')
      return false
    }
    setNeedsAuth(false)
    setPassword('')
    setError('')
    return true
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (needsAuth) {
        const ok = await login()
        if (!ok) return
      }

      const payload = {
        title,
        kind,
        release_date: date,
        url: url.trim() || null,
        notes: notes.trim() || null,
      }

      const res = await fetch(editing ? `/api/releases/${initial.id}` : '/api/releases', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.status === 401) {
        setNeedsAuth(true)
        return
      }

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Could not save.')
        return
      }
      const release = parseRelease(data.release)
      if (!release) {
        setError('Unexpected response.')
        return
      }
      onSaved(release)
    } catch {
      setError('Request failed.')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!initial.id) return
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`/api/releases/${initial.id}`, { method: 'DELETE' })
      if (res.status === 401) {
        setNeedsAuth(true)
        return
      }
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Could not delete.')
        return
      }
      onDeleted?.(initial.id)
    } catch {
      setError('Request failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="overlay-sheet"
      data-closing={closing ? '' : undefined}
      onTransitionEnd={handleTransitionEnd}
    >
      <header
        className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top)]"
        style={{ borderBottom: '1px solid var(--border)', minHeight: 52 }}
      >
        <button
          type="button"
          onClick={requestClose}
          className="pressable"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--muted)',
            cursor: 'pointer',
            fontSize: 14,
            padding: '12px 0',
          }}
        >
          Cancel
        </button>
        <p style={{ margin: 0 }}>
          {editing ? 'Edit release' : 'Add release'}
        </p>
        <span style={{ width: 52 }} />
      </header>

      <form
        onSubmit={submit}
        className="mx-auto w-full overflow-y-auto"
        style={{ maxWidth: 576, padding: '20px 20px calc(24px + env(safe-area-inset-bottom))' }}
      >
        {needsAuth && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 10px' }}>
              Sign in to add or edit releases.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              style={inputStyle}
              autoFocus
            />
          </div>
        )}

        <label style={labelStyle}>Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="GTA VI, The Last of Us S3…"
          required
          style={{ ...inputStyle, marginBottom: 16 }}
        />

        <label style={labelStyle}>Type</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 24 }}>
          {RELEASE_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: kind === k ? 'var(--foreground)' : 'var(--muted)',
              }}
            >
              {kindLabel(k)}
            </button>
          ))}
        </div>

        <label style={labelStyle}>Release date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          style={{ ...inputStyle, marginBottom: 24 }}
        />

        <label style={labelStyle}>Link</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://"
          style={{ ...inputStyle, marginBottom: 24 }}
        />

        <label style={labelStyle}>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional"
          style={{ ...inputStyle, minHeight: 88, resize: 'vertical', marginBottom: 40 }}
        />

        {error && (
          <p style={{ color: '#c00', margin: '0 0 16px' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={saving || !title.trim() || !date}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: 'var(--foreground)',
            cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.5 : 1,
          }}
        >
          {saving ? 'Saving…' : editing ? 'Save' : 'Add release'}
        </button>

        {editing && (
          <button
            type="button"
            onClick={remove}
            disabled={saving}
            style={{
              display: 'block',
              marginTop: 24,
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--muted)',
              cursor: saving ? 'default' : 'pointer',
            }}
          >
            Delete
          </button>
        )}
      </form>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--muted)',
  marginBottom: 8,
}

function parseRelease(value: unknown): Release | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  if (typeof row.id !== 'string') return null
  if (typeof row.title !== 'string') return null
  if (!isReleaseKind(row.kind)) return null
  if (typeof row.release_date !== 'string') return null
  return {
    id: row.id,
    title: row.title,
    kind: row.kind,
    release_date: row.release_date,
    url: typeof row.url === 'string' ? row.url : null,
    notes: typeof row.notes === 'string' ? row.notes : null,
    created_at: typeof row.created_at === 'string' ? row.created_at : undefined,
  }
}
