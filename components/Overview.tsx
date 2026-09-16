'use client'

import { useState } from 'react'
import ReaderSheet from './ReaderSheet'
import {
  ArticleCard,
  FeedItemRow,
  Video,
  VideoCard,
  isArticle,
} from './content-cards'
import { Release, todayDateStr, whenLabel } from '@/lib/releases'

type OverviewTab = 'articles' | 'videos' | 'releases'

interface Props {
  items: FeedItemRow[]
  videos: Video[]
  releases: Release[]
  onSeeAll: (tab: OverviewTab) => void
}

export default function Overview({ items, videos, releases, onSeeAll }: Props) {
  const [reader, setReader] = useState<{ url: string; title: string } | null>(null)
  const today = todayDateStr()

  const articles = items
    .filter(isArticle)
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 4)
  const latestVideos = [...videos]
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 2)
  const upcoming = releases
    .filter((r) => r.release_date >= today)
    .sort((a, b) => a.release_date.localeCompare(b.release_date) || a.title.localeCompare(b.title))
    .slice(0, 5)

  const empty = upcoming.length === 0 && articles.length === 0 && latestVideos.length === 0

  return (
    <>
      {reader && (
        <ReaderSheet
          url={reader.url}
          fallbackTitle={reader.title}
          onClose={() => setReader(null)}
        />
      )}

      <div className="page-column">
        {empty ? (
          <p className="type-body" style={{ margin: 0 }}>
            Nothing here yet. Add RSS or YouTube sources in admin.
          </p>
        ) : (
          <div className="section-stack">
            {upcoming.length > 0 && (
              <section>
                <SectionHeader title="Coming up" onSeeAll={() => onSeeAll('releases')} />
                <div className="row-stack">
                  {upcoming.map((release) => (
                    <button
                      key={release.id}
                      type="button"
                      onClick={() => onSeeAll('releases')}
                      className="digest-item w-full text-left"
                    >
                      <p className="type-meta" style={{ margin: 0 }}>
                        {whenLabel(release.release_date, today)}
                      </p>
                      <p className="type-title" style={{ marginTop: 'var(--space-tight)' }}>
                        {release.title}
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {articles.length > 0 && (
              <section>
                <SectionHeader title="Articles" onSeeAll={() => onSeeAll('articles')} />
                <div className="row-stack">
                  {articles.map((item) => (
                    <ArticleCard
                      key={item.id}
                      item={item}
                      onOpen={() => item.url && setReader({ url: item.url, title: item.title })}
                    />
                  ))}
                </div>
              </section>
            )}

            {latestVideos.length > 0 && (
              <section>
                <SectionHeader title="Videos" onSeeAll={() => onSeeAll('videos')} />
                <div className="cluster" style={{ gap: 40 }}>
                  {latestVideos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  return (
    <div
      className="flex items-baseline justify-between"
      style={{ marginBottom: 28, gap: 24 }}
    >
      <p className="type-meta" style={{ margin: 0, color: 'var(--muted)' }}>
        {title}
      </p>
      <button
        type="button"
        onClick={onSeeAll}
        className="type-meta"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--muted)',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        See all
      </button>
    </div>
  )
}
