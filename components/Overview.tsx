'use client'

import { useState } from 'react'
import ReaderSheet from './ReaderSheet'
import {
  ArticleCard,
  FeedItemRow,
  PostCard,
  Video,
  VideoCard,
  isArticle,
  isPost,
} from './content-cards'
import { Release, kindLabel, todayDateStr, whenLabel } from '@/lib/releases'

type OverviewTab = 'articles' | 'posts' | 'videos' | 'releases'

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
  const posts = items
    .filter(isPost)
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 3)
  const latestVideos = [...videos]
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 2)
  const upcoming = releases
    .filter((r) => r.release_date >= today)
    .sort((a, b) => a.release_date.localeCompare(b.release_date) || a.title.localeCompare(b.title))
    .slice(0, 5)

  const empty =
    upcoming.length === 0 && articles.length === 0 && posts.length === 0 && latestVideos.length === 0

  return (
    <>
      {reader && (
        <ReaderSheet
          url={reader.url}
          fallbackTitle={reader.title}
          onClose={() => setReader(null)}
        />
      )}

      <div
        className="mx-auto"
        style={{
          maxWidth: 'var(--column)',
          padding: '32px 24px calc(48px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {empty ? (
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Nothing here yet. Refresh feeds in admin or add a release.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
            {upcoming.length > 0 && (
              <section>
                <SectionHeader title="Coming up" onSeeAll={() => onSeeAll('releases')} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {upcoming.map((release) => (
                    <button
                      key={release.id}
                      type="button"
                      onClick={() => onSeeAll('releases')}
                      className="digest-item w-full text-left"
                    >
                      <p style={{ color: 'var(--muted)', margin: '0 0 8px' }}>
                        {whenLabel(release.release_date, today)}
                      </p>
                      <p style={{ color: 'var(--foreground)', margin: '0 0 8px' }}>{release.title}</p>
                      <p style={{ color: 'var(--muted)', margin: 0 }}>{kindLabel(release.kind)}</p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {articles.length > 0 && (
              <section>
                <SectionHeader title="Articles" onSeeAll={() => onSeeAll('articles')} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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

            {posts.length > 0 && (
              <section>
                <SectionHeader title="Posts" onSeeAll={() => onSeeAll('posts')} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {posts.map((item) => (
                    <PostCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}

            {latestVideos.length > 0 && (
              <section>
                <SectionHeader title="Videos" onSeeAll={() => onSeeAll('videos')} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
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
      className="flex items-center justify-between"
      style={{ marginBottom: 16 }}
    >
      <p style={{ color: 'var(--muted)', margin: 0 }}>{title}</p>
      <button
        type="button"
        onClick={onSeeAll}
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
