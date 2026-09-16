'use client'

import { useEffect, useState } from 'react'
import ContentStream, { ContentTab } from '@/components/ContentStream'
import Overview from '@/components/Overview'
import ReleaseCalendar from '@/components/ReleaseCalendar'
import PushManager from '@/components/PushManager'
import { FeedItemRow, Video } from '@/components/content-cards'
import { Release } from '@/lib/releases'

type HomeTab = 'overview' | ContentTab | 'releases'

const TABS: { id: HomeTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'articles', label: 'Articles' },
  { id: 'posts', label: 'Posts' },
  { id: 'videos', label: 'Videos' },
  { id: 'releases', label: 'Releases' },
]

export default function Home() {
  const [items, setItems] = useState<FeedItemRow[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [releases, setReleases] = useState<Release[]>([])
  const [activeTab, setActiveTab] = useState<HomeTab>('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/items?limit=300').then((r) => r.json()),
      fetch('/api/videos').then((r) => r.json()),
      fetch('/api/releases').then((r) => r.json()),
    ])
      .then(([iData, vData, rData]) => {
        setItems(iData.items ?? [])
        setVideos(vData.videos ?? [])
        setReleases(rData.releases ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="h-full" style={{ background: 'var(--background)' }}>
      <aside
        className="hidden md:flex flex-col"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 200,
          height: '100vh',
          padding: '40px 24px',
          overflowY: 'auto',
          zIndex: 10,
        }}
      >
        <p style={{ color: 'var(--muted)', margin: '0 0 40px' }}>Office Hours</p>
        <nav className="flex flex-col flex-1" style={{ gap: 20 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="text-left"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: activeTab === tab.id ? 'var(--foreground)' : 'var(--muted)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div style={{ marginTop: 40 }}>
          <PushManager />
        </div>
      </aside>

      <div className="flex flex-col h-full md:hidden">
        <header
          className="flex items-center justify-between px-6 pt-[env(safe-area-inset-top)] flex-shrink-0"
          style={{ paddingBottom: 0 }}
        >
          <span style={{ color: 'var(--muted)', padding: '20px 0' }}>Office Hours</span>
          <PushManager />
        </header>
        <nav
          className="flex px-6 overflow-x-auto flex-shrink-0"
          style={{ gap: 24, scrollbarWidth: 'none', paddingBottom: 20 }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-shrink-0"
              style={{
                color: activeTab === tab.id ? 'var(--foreground)' : 'var(--muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <main className="flex-1 overflow-y-auto">{renderContent()}</main>
      </div>

      <main className="hidden md:block h-full overflow-y-auto">{renderContent()}</main>
    </div>
  )

  function renderContent() {
    if (loading) {
      return (
        <div className="px-6 py-10 mx-auto" style={{ maxWidth: 'var(--column)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

    switch (activeTab) {
      case 'overview':
        return (
          <Overview
            items={items}
            videos={videos}
            releases={releases}
            onSeeAll={setActiveTab}
          />
        )
      case 'articles':
      case 'posts':
      case 'videos':
        return <ContentStream tab={activeTab} items={items} videos={videos} />
      case 'releases':
        return <ReleaseCalendar />
      default: {
        const _exhaustive: never = activeTab
        return _exhaustive
      }
    }
  }
}
