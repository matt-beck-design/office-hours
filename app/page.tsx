'use client'

import { useEffect, useState } from 'react'
import GroupView, { FeedItemRow, Video } from '@/components/GroupView'
import PushManager from '@/components/PushManager'

interface Group {
  id: string
  name: string
}

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([])
  const [items, setItems] = useState<FeedItemRow[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/groups').then((r) => r.json()),
      fetch('/api/items?limit=300').then((r) => r.json()),
      fetch('/api/videos').then((r) => r.json()),
    ])
      .then(([gData, iData, vData]) => {
        const fetchedGroups: Group[] = gData.groups ?? []
        setGroups(fetchedGroups)
        setItems(iData.items ?? [])
        setVideos(vData.videos ?? [])
        setActiveTab(fetchedGroups[0]?.id ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const activeGroup = groups.find((g) => g.id === activeTab) ?? null

  return (
    <div className="h-full" style={{ background: 'var(--background)' }}>
      {/* ── Sidebar (desktop, fixed) ─────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 200,
          height: '100vh',
          padding: '28px 12px',
          overflowY: 'auto',
          zIndex: 10,
        }}
      >
        <p className="text-sm font-medium tracking-wide mb-6 px-2" style={{ color: 'var(--muted)' }}>
          Office Hours
        </p>
        <nav className="flex flex-col gap-0.5 flex-1">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveTab(g.id)}
              className="text-left text-sm py-2 px-3 rounded-md transition-colors"
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
        <div className="px-2 mt-4">
          <PushManager />
        </div>
      </aside>

      {/* ── Mobile layout ───────────────────────────────────────────────── */}
      <div className="flex flex-col h-full md:hidden">
        <header
          className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top)] pb-0 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <span className="text-sm font-medium py-4 tracking-wide" style={{ color: 'var(--muted)' }}>
            Office Hours
          </span>
          <PushManager />
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
                borderBottom:
                  activeTab === g.id ? '2px solid var(--foreground)' : '2px solid transparent',
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
        <main className="flex-1 overflow-y-auto">{renderContent()}</main>
      </div>

      {/* ── Desktop main ─────────────────────────────────────────────────── */}
      <main className="hidden md:block h-full overflow-y-auto">{renderContent()}</main>
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
          items={items}
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
