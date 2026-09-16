'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import ContentStream, { ContentTab } from '@/components/ContentStream'
import Overview from '@/components/Overview'
import ReleaseCalendar from '@/components/ReleaseCalendar'
import Settings from '@/components/Settings'
import { FeedItemRow, Video } from '@/components/content-cards'
import { Release } from '@/lib/releases'
import { usePullToRefresh } from '@/lib/use-pull-to-refresh'

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
  const [refreshKey, setRefreshKey] = useState(0)
  const scrollRef = useRef<HTMLElement>(null)

  const applyFeeds = useCallback(
    (iData: { items?: FeedItemRow[] }, vData: { videos?: Video[] }, rData: { releases?: Release[] }) => {
      setItems(iData.items ?? [])
      setVideos(vData.videos ?? [])
      setReleases(rData.releases ?? [])
    },
    [],
  )

  useEffect(() => {
    Promise.all([
      fetch('/api/items?limit=300').then((r) => r.json()),
      fetch('/api/videos').then((r) => r.json()),
      fetch('/api/releases').then((r) => r.json()),
    ])
      .then(([iData, vData, rData]) => {
        applyFeeds(iData, vData, rData)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [applyFeeds])

  const onRefresh = useCallback(async () => {
    try {
      const opts: RequestInit = { cache: 'no-store' }
      const [iData, vData, rData] = await Promise.all([
        fetch('/api/items?limit=300&fresh=1', opts).then((r) => r.json()),
        fetch('/api/videos?fresh=1', opts).then((r) => r.json()),
        fetch('/api/releases?fresh=1', opts).then((r) => r.json()),
      ])
      applyFeeds(iData, vData, rData)
      setRefreshKey((k) => k + 1)
    } catch {
      // Keep existing content if the refresh fails.
    }
  }, [applyFeeds])

  const { pull, refreshing, threshold } = usePullToRefresh(scrollRef, {
    onRefresh,
    disabled: loading || activeTab === 'settings',
  })

  const indicatorVisible = pull > 8 || refreshing
  const armed = pull >= threshold || refreshing

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
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div
            className="pull-refresh-indicator"
            aria-hidden={!indicatorVisible}
            style={{
              height: pull,
              opacity: indicatorVisible ? Math.min(1, pull / threshold) : 0,
            }}
          >
            <p
              className="type-meta"
              style={{
                margin: 0,
                color: armed ? 'var(--foreground)' : 'var(--muted)',
              }}
            >
              {refreshing ? 'Updating' : armed ? 'Release' : 'Pull to refresh'}
            </p>
          </div>
          <div
            style={{
              transform: pull > 0 ? `translateY(${Math.max(0, pull - threshold) * 0.15}px)` : undefined,
            }}
          >
            {renderContent()}
          </div>
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
        return <ReleaseCalendar refreshKey={refreshKey} />
      case 'settings':
        return <Settings />
      default: {
        const _exhaustive: never = activeTab
        return _exhaustive
      }
    }
  }
}
