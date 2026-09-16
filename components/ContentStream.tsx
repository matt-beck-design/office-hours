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

export type ContentTab = 'articles' | 'videos'
export type { FeedItemRow, Video }

interface Props {
  tab: ContentTab
  items: FeedItemRow[]
  videos: Video[]
}

export default function ContentStream({ tab, items, videos }: Props) {
  const [reader, setReader] = useState<{ url: string; title: string } | null>(null)

  if (tab === 'videos') {
    const list = [...videos].sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
    )
    if (list.length === 0) return <EmptyState label="videos" />
    return (
      <div className="page-column">
        <div className="cluster" style={{ gap: 48 }}>
          {list.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>
    )
  }

  const filtered = items
    .filter(isArticle)
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())

  if (filtered.length === 0) return <EmptyState label="articles" />

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
        <div className="row-stack">
          {filtered.map((item) => (
            <ArticleCard
              key={item.id}
              item={item}
              onOpen={() => item.url && setReader({ url: item.url, title: item.title })}
            />
          ))}
        </div>
      </div>
    </>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="page-column">
      <p className="type-body" style={{ margin: 0 }}>
        No {label} yet. Run a feed refresh from admin to pull content.
      </p>
    </div>
  )
}
