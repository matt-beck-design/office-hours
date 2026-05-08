'use client'

import { useEffect, useState } from 'react'
import GroupView from '@/components/GroupView'

interface Group {
  id: string
  name: string
}

interface DigestSection {
  heading: string
  items: { title: string; summary: string; url: string; source?: string }[]
}

interface Digest {
  id: string
  date: string
  content: { sections?: DigestSection[]; raw?: string }
}

interface Video {
  id: string
  channel_id: string
  channel_name: string
  title: string
  thumbnail_url: string
  video_url: string
  published_at: string
  group_id?: string
}

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([])
  const [digests, setDigests] = useState<Digest[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/groups').then((r) => r.json()),
      fetch('/api/digest').then((r) => r.json()),
      fetch('/api/videos').then((r) => r.json()),
    ]).then(([gData, dData, vData]) => {
      const fetchedGroups: Group[] = gData.groups ?? []
      setGroups(fetchedGroups)
      setDigests(dData.digests ?? [])
      setVideos(vData.videos ?? [])
      setActiveTab(fetchedGroups[0]?.id ?? null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const activeGroup = groups.find((g) => g.id === activeTab) ?? null

  return (
    <div className="flex h-full" style={{ background: 'var(--background)' }}>

      {/* ── Sidebar (desktop) ───────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0"
        style={{
          width: 220,
          borderRight: '1px solid var(--border)',
          padding: '32px 24px',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        <p
          className="text-sm font-medium tracking-wide mb-8"
          style={{ color: 'var(--muted)' }}
        >
          Office Hours
        </p>
        <nav className="flex flex-col gap-1">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveTab(g.id)}
              className="text-left text-sm py-1.5 px-2 rounded-md transition-colors"
              style={{
                background: activeTab === g.id ? 'var(--hover-bg)' : 'none',
                color: activeTab === g.id ? 'var(--foreground)' : 'var(--muted)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {g.name}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Mobile tab bar ──────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 md:hidden">
        <header
          className="flex items-center px-5 pt-[env(safe-area-inset-top)] pb-0 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <span className="text-sm font-medium py-4 tracking-wide" style={{ color: 'var(--muted)' }}>
            Office Hours
          </span>
        </header>
        <nav
          className="flex px-5 overflow-x-auto flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)', scrollbarWidth: 'none' }}
        >
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveTab(g.id)}
              className="py-3 px-1 mr-5 text-sm font-medium transition-colors flex-shrink-0"
              style={{
                color: activeTab === g.id ? 'var(--foreground)' : 'var(--muted)',
                borderBottom: activeTab === g.id ? '2px solid var(--foreground)' : '2px solid transparent',
                marginBottom: '-1px',
                background: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {g.name}
            </button>
          ))}
        </nav>
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {/* ── Desktop main content ─────────────────────────────────────────── */}
      <main className="hidden md:block flex-1 overflow-y-auto">
        {renderContent()}
      </main>

    </div>
  )

  function renderContent() {
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
    if (activeGroup) {
      return (
        <GroupView
          key={activeGroup.id}
          groupId={activeGroup.id}
          groupName={activeGroup.name}
          digests={digests}
          videos={videos}
        />
      )
    }
    return (
      <div className="px-5 py-12 mx-auto text-center" style={{ maxWidth: '576px' }}>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          No feed groups yet. Add them in admin.
        </p>
      </div>
    )
  }
}
