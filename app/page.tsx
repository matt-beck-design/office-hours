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
          padding: '28px 12px',
          overflowY: 'auto',
          zIndex: 10,
        }}
      >
        <p className="text-sm font-medium tracking-wide mb-6 px-2" style={{ color: 'var(--muted)' }}>
          Office Hours
        </p>
        <nav className="flex flex-col gap-0.5 flex-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="text-left text-sm py-2 px-3 rounded-md transition-colors"
              style={{
                background: activeTab === tab.id ? 'var(--hover-bg)' : 'none',
                color: activeTab === tab.id ? 'var(--foreground)' : 'var(--muted)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="px-2 mt-4">
          <PushManager />
        </div>
      </aside>

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
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="py-3 px-1 mr-5 text-sm font-medium transition-colors flex-shrink-0"
              style={{
                color: activeTab === tab.id ? 'var(--foreground)' : 'var(--muted)',
                borderBottom:
                  activeTab === tab.id ? '2px solid var(--foreground)' : '2px solid transparent',
                marginBottom: '-1px',
                background: 'none',
                cursor: 'pointer',
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
