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
  image_url?: string | null
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

export function isArticle(item: FeedItemRow): boolean {
  if (item.source_type === 'bluesky') return false
  if (item.source_type === 'rss') return true
  return !item.url.includes('bsky.app')
}

export function ArticleCard({ item, onOpen }: { item: FeedItemRow; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="block digest-item w-full text-left">
      {item.image_url && (
        <div className="article-thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image_url} alt="" loading="lazy" decoding="async" />
        </div>
      )}
      <p className="type-title">{item.title}</p>
      {item.summary && <p className="type-body line-clamp-3">{item.summary}</p>}
      <p className="type-meta">
        {item.source_name} {relativeDate(item.published_at)}
      </p>
    </button>
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
            sizes="(max-width: 540px) 100vw, 540px"
            className="object-cover"
          />
        </div>
      )}
      <div className="video-meta cluster">
        <p className="type-title line-clamp-2">{video.title}</p>
        <p className="type-meta">
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
