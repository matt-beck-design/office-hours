'use client'

import { useCallback, useEffect, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface FeedSource {
  id: string
  group_id: string
  name: string
  type: 'rss' | 'bluesky'
  url?: string
  handle?: string
  tier: 'breaking' | 'daily'
  enabled: boolean
}

interface FeedGroup {
  id: string
  name: string
  topic: string
  position: number
  feed_sources: FeedSource[]
}

interface YouTubeChannel {
  id: string
  name: string
  channel_id: string
  enabled: boolean
}

type Tab = 'sources' | 'youtube' | 'controls'

// ── Styles ────────────────────────────────────────────────────────────────────

const input: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '14px',
  background: 'var(--background)',
  color: 'var(--foreground)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  outline: 'none',
  minHeight: '44px',
}

function btn(
  variant: 'primary' | 'default' | 'danger' | 'ghost' = 'default',
  extra: React.CSSProperties = {},
): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 500,
    borderRadius: '6px',
    cursor: 'pointer',
    minHeight: '36px',
    border: '1px solid var(--border)',
    transition: 'opacity 0.1s',
    ...extra,
  }
  if (variant === 'primary') return { ...base, background: 'var(--foreground)', color: 'var(--background)', border: 'none' }
  if (variant === 'danger') return { ...base, background: 'transparent', color: '#c00', borderColor: '#fcc' }
  if (variant === 'ghost') return { ...base, background: 'transparent', color: 'var(--muted)', border: 'none', padding: '4px 8px' }
  return { ...base, background: 'transparent', color: 'var(--foreground)' }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [tab, setTab] = useState<Tab>('sources')
  const [groups, setGroups] = useState<FeedGroup[]>([])
  const [youtube, setYoutube] = useState<YouTubeChannel[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  // Group forms
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [newGroup, setNewGroup] = useState({ name: '', topic: '' })
  const [editingGroup, setEditingGroup] = useState<{ id: string; name: string; topic: string } | null>(null)

  // Source forms — one open at a time, keyed by `${groupId}:${tier}`
  const [addSourceKey, setAddSourceKey] = useState<string | null>(null)
  const [newSource, setNewSource] = useState({ name: '', type: 'rss' as 'rss' | 'bluesky', url: '', handle: '' })

  // YouTube form
  const [showNewYt, setShowNewYt] = useState(false)
  const [newYt, setNewYt] = useState({ name: '', channelId: '' })

  // Inline editing
  const [editingSource, setEditingSource] = useState<FeedSource | null>(null)
  const [editingYt, setEditingYt] = useState<YouTubeChannel | null>(null)

  // Source test results, keyed by source id
  const [testResults, setTestResults] = useState<Record<string, { state: 'running' | 'ok' | 'error'; message: string; preview?: { title: string; published: string }[] }>>({})

  // Controls
  const [ctrlStatus, setCtrlStatus] = useState<{ action: string; state: 'idle' | 'running' | 'done' | 'error'; message: string }>({ action: '', state: 'idle', message: '' })

  // ── Auth ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/admin/auth')
      .then((r) => r.json())
      .then((d) => { setAuthed(d.authenticated); setAuthLoading(false) })
      .catch(() => setAuthLoading(false))
  }, [])

  async function login(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) { setAuthed(true); setLoginError('') }
    else setLoginError('Wrong password.')
  }

  async function logout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    setAuthed(false)
  }

  // ── Data ────────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setDataLoading(true)
    const [gRes, yRes] = await Promise.all([
      fetch('/api/admin/groups').then((r) => r.json()),
      fetch('/api/admin/youtube').then((r) => r.json()),
    ])
    setGroups(gRes.groups ?? [])
    setYoutube(yRes.channels ?? [])
    setDataLoading(false)
  }, [])

  useEffect(() => { if (authed) loadData() }, [authed, loadData])

  // ── Groups ──────────────────────────────────────────────────────────────────

  async function createGroup(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/admin/groups', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(newGroup),
    })
    setNewGroup({ name: '', topic: '' })
    setShowNewGroup(false)
    loadData()
  }

  async function saveGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!editingGroup) return
    await fetch(`/api/admin/groups/${editingGroup.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: editingGroup.name, topic: editingGroup.topic }),
    })
    setEditingGroup(null)
    loadData()
  }

  async function deleteGroup(id: string) {
    if (!confirm('Delete this group and all its sources?')) return
    await fetch(`/api/admin/groups/${id}`, { method: 'DELETE' })
    loadData()
  }

  // ── Sources ─────────────────────────────────────────────────────────────────

  function openAddSource(groupId: string, tier: 'breaking' | 'daily') {
    const key = `${groupId}:${tier}`
    setAddSourceKey(addSourceKey === key ? null : key)
    setNewSource({ name: '', type: 'rss', url: '', handle: '' })
  }

  async function createSource(e: React.FormEvent, groupId: string, tier: 'breaking' | 'daily') {
    e.preventDefault()
    await fetch('/api/admin/sources', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        group_id: groupId,
        tier,
        name: newSource.name,
        type: newSource.type,
        url: newSource.type === 'rss' ? newSource.url : undefined,
        handle: newSource.type === 'bluesky' ? newSource.handle : undefined,
      }),
    })
    setAddSourceKey(null)
    loadData()
  }

  async function deleteSource(id: string) {
    await fetch(`/api/admin/sources/${id}`, { method: 'DELETE' })
    loadData()
  }

  async function saveSource(e: React.FormEvent) {
    e.preventDefault()
    if (!editingSource) return
    await fetch(`/api/admin/sources/${editingSource.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: editingSource.name,
        type: editingSource.type,
        url: editingSource.type === 'rss' ? editingSource.url : null,
        handle: editingSource.type === 'bluesky' ? editingSource.handle : null,
      }),
    })
    setEditingSource(null)
    loadData()
  }

  async function testSource(src: FeedSource) {
    setTestResults((r) => ({ ...r, [src.id]: { state: 'running', message: 'Testing…' } }))
    const res = await fetch('/api/admin/test-source', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: src.type, url: src.url, handle: src.handle, name: src.name }),
    })
    const data = await res.json()
    setTestResults((r) => ({
      ...r,
      [src.id]: {
        state: data.ok ? 'ok' : 'error',
        message: data.ok ? `${data.count} items fetched` : data.message,
        preview: data.preview,
      },
    }))
  }

  // ── YouTube ─────────────────────────────────────────────────────────────────

  async function createYt(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/admin/youtube', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: newYt.name, channel_id: newYt.channelId }),
    })
    setNewYt({ name: '', channelId: '' })
    setShowNewYt(false)
    loadData()
  }

  async function deleteYt(id: string) {
    await fetch(`/api/admin/youtube/${id}`, { method: 'DELETE' })
    loadData()
  }

  async function saveYt(e: React.FormEvent) {
    e.preventDefault()
    if (!editingYt) return
    await fetch(`/api/admin/youtube/${editingYt.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: editingYt.name, channel_id: editingYt.channel_id }),
    })
    setEditingYt(null)
    loadData()
  }

  // ── Controls ────────────────────────────────────────────────────────────────

  async function runAction(action: 'seed' | 'daily' | 'breaking') {
    setCtrlStatus({ action, state: 'running', message: '' })
    const url = action === 'seed' ? '/api/admin/seed' : `/api/admin/trigger/${action}`
    try {
      const res = await fetch(url, { method: 'POST' })
      const data = await res.json()
      setCtrlStatus({ action, state: res.ok ? 'done' : 'error', message: data.message ?? data.error ?? '' })
      if (action === 'seed') loadData()
    } catch {
      setCtrlStatus({ action, state: 'error', message: 'Request failed.' })
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (authLoading) return null

  if (!authed) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={login} style={{ width: '100%', maxWidth: 320, padding: '0 24px', display: 'grid', gap: 10 }}>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>Office Hours — Admin</p>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={input}
            autoFocus
          />
          {loginError && <p style={{ fontSize: 12, color: '#c00', margin: 0 }}>{loginError}</p>}
          <button type="submit" style={btn('primary', { width: '100%' })}>Sign in</button>
        </form>
      </div>
    )
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'sources', label: 'Sources' },
    { key: 'youtube', label: 'YouTube' },
    { key: 'controls', label: 'Controls' },
  ]

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--background)', paddingBottom: 48 }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>Office Hours — Admin</span>
        <button onClick={logout} style={btn('ghost')}>Sign out</button>
      </header>

      {/* Tabs */}
      <nav style={{ display: 'flex', padding: '0 20px', borderBottom: '1px solid var(--border)' }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '12px 4px',
              marginRight: 20,
              fontSize: 13,
              fontWeight: 500,
              background: 'none',
              border: 'none',
              borderBottom: tab === key ? '2px solid var(--foreground)' : '2px solid transparent',
              marginBottom: -1,
              color: tab === key ? 'var(--foreground)' : 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 20px' }}>
        {dataLoading && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Loading…</p>}

        {/* ── Sources tab ──────────────────────────────────────────────────── */}
        {tab === 'sources' && !dataLoading && (
          <div style={{ display: 'grid', gap: 24 }}>
            {groups.map((group) => (
              <div
                key={group.id}
                style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}
              >
                {/* Group header */}
                {editingGroup?.id === group.id ? (
                  <form onSubmit={saveGroup} style={{ padding: '14px 16px', display: 'grid', gap: 8, background: 'var(--tab-bg)' }}>
                    <input
                      value={editingGroup.name}
                      onChange={(e) => setEditingGroup((g) => g && ({ ...g, name: e.target.value }))}
                      placeholder="Group name"
                      style={input}
                      required
                    />
                    <input
                      value={editingGroup.topic}
                      onChange={(e) => setEditingGroup((g) => g && ({ ...g, topic: e.target.value }))}
                      placeholder="Topic hint (passed to Claude)"
                      style={input}
                      required
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" style={btn('primary')}>Save</button>
                      <button type="button" onClick={() => setEditingGroup(null)} style={btn()}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, background: 'var(--tab-bg)' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{group.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>{group.topic}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => setEditingGroup({ id: group.id, name: group.name, topic: group.topic })}
                        style={btn('ghost')}
                      >
                        Edit
                      </button>
                      <button onClick={() => deleteGroup(group.id)} style={btn('ghost', { color: '#c00' })}>Delete</button>
                    </div>
                  </div>
                )}

                {/* Sources by tier */}
                <div style={{ padding: '12px 16px', display: 'grid', gap: 16 }}>
                  {(['breaking', 'daily'] as const).map((tier) => {
                    const tierSources = group.feed_sources.filter((s) => s.tier === tier)
                    const key = `${group.id}:${tier}`
                    return (
                      <div key={tier}>
                        {/* Tier label + add button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                            {tier}
                          </span>
                          <button
                            onClick={() => openAddSource(group.id, tier)}
                            style={btn('ghost', { fontSize: 12, padding: '2px 6px', minHeight: 24 })}
                          >
                            {addSourceKey === key ? 'Cancel' : '+ Add'}
                          </button>
                        </div>

                        {/* Source rows */}
                        {tierSources.length === 0 && addSourceKey !== key && (
                          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>No sources yet.</p>
                        )}
                        {tierSources.map((src) => {
                          const result = testResults[src.id]
                          const isEditing = editingSource?.id === src.id
                          return (
                            <div key={src.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 2 }}>
                              {isEditing ? (
                                <form onSubmit={saveSource} style={{ display: 'grid', gap: 8, padding: '8px 0' }}>
                                  <input
                                    value={editingSource.name}
                                    onChange={(e) => setEditingSource((s) => s && ({ ...s, name: e.target.value }))}
                                    placeholder="Name"
                                    style={input}
                                    required
                                  />
                                  <select
                                    value={editingSource.type}
                                    onChange={(e) => setEditingSource((s) => s && ({ ...s, type: e.target.value as 'rss' | 'bluesky' }))}
                                    style={input}
                                  >
                                    <option value="rss">RSS</option>
                                    <option value="bluesky">Bluesky</option>
                                  </select>
                                  {editingSource.type === 'rss' && (
                                    <input
                                      value={editingSource.url ?? ''}
                                      onChange={(e) => setEditingSource((s) => s && ({ ...s, url: e.target.value }))}
                                      placeholder="Feed URL"
                                      style={input}
                                      type="url"
                                      required
                                    />
                                  )}
                                  {editingSource.type === 'bluesky' && (
                                    <input
                                      value={editingSource.handle ?? ''}
                                      onChange={(e) => setEditingSource((s) => s && ({ ...s, handle: e.target.value }))}
                                      placeholder="Handle"
                                      style={input}
                                      required
                                    />
                                  )}
                                  <div style={{ display: 'flex', gap: 8 }}>
                                    <button type="submit" style={btn('primary')}>Save</button>
                                    <button type="button" onClick={() => setEditingSource(null)} style={btn()}>Cancel</button>
                                  </div>
                                </form>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                                  <span style={{ fontSize: 13, flex: '0 0 auto', fontWeight: 500 }}>{src.name}</span>
                                  <span style={{ fontSize: 11, color: 'var(--muted)', padding: '1px 5px', border: '1px solid var(--border)', borderRadius: 3, flex: '0 0 auto' }}>
                                    {src.type}
                                  </span>
                                  <span style={{ fontSize: 12, color: 'var(--muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {src.type === 'rss' ? src.url : `@${src.handle}`}
                                  </span>
                                  <button
                                    onClick={() => { setEditingSource(src); setTestResults((r) => { const n = {...r}; delete n[src.id]; return n }) }}
                                    style={btn('ghost', { fontSize: 12, padding: '2px 6px', minHeight: 24, flex: '0 0 auto' })}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => testSource(src)}
                                    disabled={result?.state === 'running'}
                                    style={btn('ghost', { fontSize: 12, padding: '2px 6px', minHeight: 24, flex: '0 0 auto', color: 'var(--muted)' })}
                                  >
                                    {result?.state === 'running' ? '…' : 'Test'}
                                  </button>
                                  <button
                                    onClick={() => deleteSource(src.id)}
                                    style={btn('ghost', { color: '#c00', padding: '2px 6px', minHeight: 24, flex: '0 0 auto' })}
                                  >
                                    ×
                                  </button>
                                </div>
                              )}
                              {!isEditing && result && result.state !== 'running' && (
                                <div style={{ paddingLeft: 2 }}>
                                  <p style={{ fontSize: 12, color: result.state === 'ok' ? '#2a7a2a' : '#c00', margin: '2px 0 4px' }}>
                                    {result.state === 'ok' ? '✓' : '✗'} {result.message}
                                  </p>
                                  {result.preview?.map((p, i) => (
                                    <p key={i} style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {relativeTime(p.published)} — {p.title}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}

                        {/* Inline add-source form */}
                        {addSourceKey === key && (
                          <form
                            onSubmit={(e) => createSource(e, group.id, tier)}
                            style={{ marginTop: 8, padding: 12, background: 'var(--tab-bg)', borderRadius: 6, display: 'grid', gap: 8 }}
                          >
                            <input
                              placeholder="Name"
                              value={newSource.name}
                              onChange={(e) => setNewSource((s) => ({ ...s, name: e.target.value }))}
                              style={input}
                              required
                            />
                            <select
                              value={newSource.type}
                              onChange={(e) => setNewSource((s) => ({ ...s, type: e.target.value as 'rss' | 'bluesky' }))}
                              style={input}
                            >
                              <option value="rss">RSS</option>
                              <option value="bluesky">Bluesky</option>
                            </select>
                            {newSource.type === 'rss' && (
                              <input
                                placeholder="Feed URL"
                                value={newSource.url}
                                onChange={(e) => setNewSource((s) => ({ ...s, url: e.target.value }))}
                                style={input}
                                type="url"
                                required
                              />
                            )}
                            {newSource.type === 'bluesky' && (
                              <input
                                placeholder="Handle (e.g. user.bsky.social)"
                                value={newSource.handle}
                                onChange={(e) => setNewSource((s) => ({ ...s, handle: e.target.value }))}
                                style={input}
                                required
                              />
                            )}
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button type="submit" style={btn('primary')}>Add source</button>
                              <button type="button" onClick={() => setAddSourceKey(null)} style={btn()}>Cancel</button>
                            </div>
                          </form>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Add group */}
            {showNewGroup ? (
              <form
                onSubmit={createGroup}
                style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', display: 'grid', gap: 8 }}
              >
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>New feed group</p>
                <input
                  placeholder="Name (e.g. Gaming)"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup((g) => ({ ...g, name: e.target.value }))}
                  style={input}
                  required
                />
                <input
                  placeholder="Topic hint (passed to Claude as context)"
                  value={newGroup.topic}
                  onChange={(e) => setNewGroup((g) => ({ ...g, topic: e.target.value }))}
                  style={input}
                  required
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" style={btn('primary')}>Create group</button>
                  <button type="button" onClick={() => setShowNewGroup(false)} style={btn()}>Cancel</button>
                </div>
              </form>
            ) : (
              <button onClick={() => setShowNewGroup(true)} style={btn('default', { justifySelf: 'start' })}>
                + Add feed group
              </button>
            )}
          </div>
        )}

        {/* ── YouTube tab ──────────────────────────────────────────────────── */}
        {tab === 'youtube' && !dataLoading && (
          <div style={{ display: 'grid', gap: 16 }}>
            {youtube.length === 0 && !showNewYt && (
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>No YouTube channels yet.</p>
            )}
            {youtube.map((ch) => (
              <div key={ch.id} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                {editingYt?.id === ch.id ? (
                  <form onSubmit={saveYt} style={{ padding: '14px 16px', display: 'grid', gap: 8 }}>
                    <input
                      value={editingYt.name}
                      onChange={(e) => setEditingYt((y) => y && ({ ...y, name: e.target.value }))}
                      placeholder="Channel name"
                      style={input}
                      required
                    />
                    <input
                      value={editingYt.channel_id}
                      onChange={(e) => setEditingYt((y) => y && ({ ...y, channel_id: e.target.value }))}
                      placeholder="Channel ID (UC…)"
                      style={input}
                      required
                    />
                    <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>
                      Must start with UC — find it in the channel URL or right-click → View source → search &quot;channelId&quot;
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" style={btn('primary')}>Save</button>
                      <button type="button" onClick={() => setEditingYt(null)} style={btn()}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 500, fontSize: 14, margin: 0 }}>{ch.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0', fontFamily: 'monospace' }}>{ch.channel_id}</p>
                    </div>
                    <button onClick={() => setEditingYt(ch)} style={btn('ghost')}>Edit</button>
                    <button onClick={() => deleteYt(ch.id)} style={btn('ghost', { color: '#c00' })}>Remove</button>
                  </div>
                )}
              </div>
            ))}

            {showNewYt ? (
              <form
                onSubmit={createYt}
                style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', display: 'grid', gap: 8 }}
              >
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Add YouTube channel</p>
                <input
                  placeholder="Channel name"
                  value={newYt.name}
                  onChange={(e) => setNewYt((y) => ({ ...y, name: e.target.value }))}
                  style={input}
                  required
                />
                <input
                  placeholder="Channel ID (starts with UC…)"
                  value={newYt.channelId}
                  onChange={(e) => setNewYt((y) => ({ ...y, channelId: e.target.value }))}
                  style={input}
                  required
                />
                <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>
                  Find the channel ID in the channel URL or via youtube.com/@handle → View source → &quot;channelId&quot;
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" style={btn('primary')}>Add channel</button>
                  <button type="button" onClick={() => setShowNewYt(false)} style={btn()}>Cancel</button>
                </div>
              </form>
            ) : (
              <button onClick={() => setShowNewYt(true)} style={btn('default', { justifySelf: 'start' })}>
                + Add channel
              </button>
            )}
          </div>
        )}

        {/* ── Controls tab ─────────────────────────────────────────────────── */}
        {tab === 'controls' && (
          <div style={{ display: 'grid', gap: 20 }}>

            {/* Seed */}
            <ControlCard
              title="Import from sources.config.js"
              description="Replaces all current DB sources with the contents of sources.config.js. Use this once to bootstrap, or to reset."
              action="seed"
              label="Import"
              ctrlStatus={ctrlStatus}
              onRun={runAction}
            />

            {/* Daily digest */}
            <ControlCard
              title="Run daily digest"
              description="Fetches all feeds, generates a digest via Claude, stores it, and sends a push notification."
              action="daily"
              label="Run now"
              ctrlStatus={ctrlStatus}
              onRun={runAction}
            />

            {/* Breaking news */}
            <ControlCard
              title="Run breaking news check"
              description="Polls breaking-tier sources, asks Claude to evaluate newsworthiness, fires a push only if something clears the bar."
              action="breaking"
              label="Run now"
              ctrlStatus={ctrlStatus}
              onRun={runAction}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ── ControlCard ───────────────────────────────────────────────────────────────

function ControlCard({
  title,
  description,
  action,
  label,
  ctrlStatus,
  onRun,
}: {
  title: string
  description: string
  action: 'seed' | 'daily' | 'breaking'
  label: string
  ctrlStatus: { action: string; state: string; message: string }
  onRun: (a: 'seed' | 'daily' | 'breaking') => void
}) {
  const active = ctrlStatus.action === action
  const running = active && ctrlStatus.state === 'running'

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '16px' }}>
      <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 4px' }}>{title}</p>
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 14px' }}>{description}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={() => onRun(action)}
          disabled={running}
          style={btn('primary', { opacity: running ? 0.6 : 1 })}
        >
          {running ? 'Running…' : label}
        </button>
        {active && ctrlStatus.state !== 'idle' && ctrlStatus.state !== 'running' && ctrlStatus.message && (
          <p style={{ fontSize: 12, color: ctrlStatus.state === 'error' ? '#c00' : 'var(--muted)', margin: 0 }}>
            {ctrlStatus.message}
          </p>
        )}
      </div>
    </div>
  )
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}
