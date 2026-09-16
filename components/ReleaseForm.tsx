'use client'

import { FormEvent, useState } from 'react'
import { Release, RELEASE_KINDS, ReleaseKind, kindLabel } from '@/lib/releases'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '16px',
  background: 'var(--background)',
  color: 'var(--foreground)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
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
      onSaved(data.release as Release)
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top)]"
        style={{ borderBottom: '1px solid var(--border)', minHeight: 52 }}
      >
        <button
          type="button"
          onClick={onClose}
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
        <p className="text-sm font-medium" style={{ margin: 0 }}>
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {RELEASE_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              style={{
                padding: '8px 12px',
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 8,
                cursor: 'pointer',
                minHeight: 36,
                border: '1px solid var(--border)',
                background: kind === k ? 'var(--foreground)' : 'transparent',
                color: kind === k ? 'var(--background)' : 'var(--foreground)',
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
          style={{ ...inputStyle, marginBottom: 16 }}
        />

        <label style={labelStyle}>Link (optional)</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://"
          style={{ ...inputStyle, marginBottom: 16 }}
        />

        <label style={labelStyle}>Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Platform, theater, anything to remember"
          style={{ ...inputStyle, minHeight: 88, resize: 'vertical', marginBottom: 20 }}
        />

        {error && (
          <p style={{ fontSize: 13, color: '#c00', margin: '0 0 12px' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={saving || !title.trim() || !date}
          style={{
            width: '100%',
            minHeight: 44,
            border: 'none',
            borderRadius: 8,
            background: 'var(--foreground)',
            color: 'var(--background)',
            fontSize: 15,
            fontWeight: 500,
            cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.6 : 1,
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
              width: '100%',
              minHeight: 44,
              marginTop: 10,
              border: 'none',
              borderRadius: 8,
              background: 'transparent',
              color: 'var(--muted)',
              fontSize: 14,
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
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  marginBottom: 8,
}
