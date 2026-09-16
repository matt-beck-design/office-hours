'use client'

import { useEffect, useState } from 'react'
import ContentStream, { ContentTab } from '@/components/ContentStream'
import Overview from '@/components/Overview'
import ReleaseCalendar from '@/components/ReleaseCalendar'
import Settings from '@/components/Settings'
import { FeedItemRow, Video } from '@/components/content-cards'
import { Release } from '@/lib/releases'

type HomeTab = 'overview' | ContentTab | 'releases' | 'settings'

const TABS: { id: HomeTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'articles', label: 'Articles' },
  { id: 'videos', label: 'Videos' },
  { id: 'releases', label: 'Releases' },
  { id: 'settings', label: 'Settings' },
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
    <div className="app-shell">
      <aside
        className="hidden md:flex flex-col"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 220,
          height: '100%',
          padding: '48px var(--gutter)',
          overflowY: 'auto',
          zIndex: 10,
        }}
      >
        <p className="brand" style={{ margin: '0 0 48px' }}>
          Office Hours
        </p>
        <nav className="flex flex-col flex-1" style={{ gap: 28 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="type-nav text-left"
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
      </aside>

      <div className="flex flex-col h-full min-h-0 md:hidden">
        <header
          className="flex-shrink-0"
          style={{
            paddingTop: 'max(12px, env(safe-area-inset-top, 0px))',
            paddingLeft: 'var(--gutter)',
            paddingRight: 'var(--gutter)',
            paddingBottom: 28,
          }}
        >
          <span className="brand" style={{ display: 'block', paddingTop: 16 }}>
            Office Hours
          </span>
        </header>
        <nav
          className="flex overflow-x-auto flex-shrink-0"
          style={{
            gap: 28,
            scrollbarWidth: 'none',
            paddingLeft: 'var(--gutter)',
            paddingRight: 'var(--gutter)',
            paddingBottom: 36,
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="type-nav flex-shrink-0"
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
        <main
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {renderContent()}
        </main>
      </div>

      <main
        className="hidden md:block h-full min-h-0 overflow-y-auto"
        style={{ marginLeft: 220 }}
      >
        {renderContent()}
      </main>
    </div>
  )

  function renderContent() {
    if (loading && activeTab !== 'settings') {
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
      case 'videos':
        return <ContentStream tab={activeTab} items={items} videos={videos} />
      case 'releases':
        return <ReleaseCalendar />
      case 'settings':
        return <Settings />
      default: {
        const _exhaustive: never = activeTab
        return _exhaustive
      }
    }
  }
}
