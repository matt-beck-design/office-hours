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
    <div className="flex flex-col h-full" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header
        className="flex items-center px-5 pt-[env(safe-area-inset-top)] pb-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <span className="text-sm font-medium py-4 tracking-wide" style={{ color: 'var(--muted)' }}>
          Office Hours
        </span>
      </header>

      {/* Tab bar */}
      <nav className="flex gap-0 px-5 overflow-x-auto" style={{ borderBottom: '1px solid var(--border)', scrollbarWidth: 'none' }}>
        {loading
          ? null
          : groups.map((g) => (
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

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {loading && (
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
        )}
        {!loading && activeGroup && (
          <GroupView
            key={activeGroup.id}
            groupId={activeGroup.id}
            groupName={activeGroup.name}
            digests={digests}
            videos={videos}
          />
        )}
        {!loading && !activeGroup && (
          <div className="px-5 py-12 mx-auto text-center" style={{ maxWidth: '576px' }}>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              No feed groups yet. Add them in admin.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
