'use client'

import Image from 'next/image'

export interface FeedItemRow {
  id: string
  external_id: string
  group_id: string
  source_name: string
  source_type?: 'rss' | 'bluesky' | null
  title: string
  url: string
  summary: string | null
  published_at: string
}

export interface Video {
  id: string
  channel_id: string
  channel_name: string
  title: string
  thumbnail_url: string
  video_url: string
  published_at: string
  group_id?: string
}

export function isPost(item: FeedItemRow): boolean {
  if (item.source_type === 'bluesky') return true
  if (item.source_type === 'rss') return false
  return item.url.includes('bsky.app')
}

export function isArticle(item: FeedItemRow): boolean {
  return !isPost(item)
}

export function ArticleCard({ item, onOpen }: { item: FeedItemRow; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="block digest-item w-full text-left">
      <p style={{ margin: '0 0 8px', color: 'var(--foreground)' }}>{item.title}</p>
      {item.summary && (
        <p className="line-clamp-3" style={{ color: 'var(--muted)', margin: '0 0 8px' }}>
          {item.summary}
        </p>
      )}
      <p style={{ color: 'var(--muted)', margin: 0 }}>
        {item.source_name} {relativeDate(item.published_at)}
      </p>
    </button>
  )
}

export function PostCard({ item }: { item: FeedItemRow }) {
  const body = item.summary || item.title
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="block digest-item">
      <p style={{ color: 'var(--foreground)', margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>{body}</p>
      <p style={{ color: 'var(--muted)', margin: 0 }}>
        {item.source_name} {relativeDate(item.published_at)}
      </p>
    </a>
  )
}

export function VideoCard({ video }: { video: Video }) {
  return (
    <a href={video.video_url} target="_blank" rel="noopener noreferrer" className="block video-item">
      {video.thumbnail_url && (
        <div className="video-thumb relative w-full overflow-hidden">
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            sizes="(max-width: 576px) 100vw, 576px"
            className="object-cover"
          />
        </div>
      )}
      <div className="video-meta">
        <p className="line-clamp-2" style={{ color: 'var(--foreground)', margin: '0 0 8px' }}>
          {video.title}
        </p>
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          {video.channel_name} {relativeDate(video.published_at)}
        </p>
      </div>
    </a>
  )
}

export function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
