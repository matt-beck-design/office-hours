'use client'

import { useState } from 'react'
import Image from 'next/image'
import ReaderSheet from './ReaderSheet'

export type ContentTab = 'articles' | 'posts' | 'videos'

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
    if (list.length === 0) {
      return <EmptyState label="videos" />
    }
    return (
      <div className="mx-auto pb-[env(safe-area-inset-bottom)]" style={{ maxWidth: '576px', paddingTop: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {list.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>
    )
  }

  const filtered = items
    .filter((item) => (tab === 'posts' ? isPost(item) : isArticle(item)))
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())

  if (filtered.length === 0) {
    return <EmptyState label={tab} />
  }

  return (
    <>
      {reader && (
        <ReaderSheet
          url={reader.url}
          fallbackTitle={reader.title}
          onClose={() => setReader(null)}
        />
      )}

      <div className="mx-auto pb-[env(safe-area-inset-bottom)]" style={{ maxWidth: '576px', paddingTop: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map((item) =>
            tab === 'posts' ? (
              <PostCard key={item.id} item={item} />
            ) : (
              <ArticleCard
                key={item.id}
                item={item}
                onOpen={() =>
                  item.url && setReader({ url: item.url, title: item.title })
                }
              />
            ),
          )}
        </div>
      </div>
    </>
  )
}

function isPost(item: FeedItemRow): boolean {
  if (item.source_type === 'bluesky') return true
  if (item.source_type === 'rss') return false
  return item.url.includes('bsky.app')
}

function isArticle(item: FeedItemRow): boolean {
  return !isPost(item)
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="px-5 py-12 mx-auto text-center" style={{ maxWidth: '576px' }}>
      <p className="text-sm" style={{ color: 'var(--muted)' }}>
        No {label} yet. Run a feed refresh from admin to pull content.
      </p>
    </div>
  )
}

function ArticleCard({ item, onOpen }: { item: FeedItemRow; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="block digest-item w-full text-left">
      <p
        className="font-medium leading-snug"
        style={{ marginBottom: '0.35rem', color: 'var(--foreground)', fontSize: '16px' }}
      >
        {item.title}
      </p>
      {item.summary && (
        <p
          className="line-clamp-3"
          style={{ color: 'var(--muted)', margin: '0 0 0.5rem', fontSize: '15px', lineHeight: '22px' }}
        >
          {item.summary}
        </p>
      )}
      <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
        {item.source_name}
        <span style={{ margin: '0 6px', opacity: 0.5 }}>·</span>
        {relativeDate(item.published_at)}
      </p>
    </button>
  )
}

function PostCard({ item }: { item: FeedItemRow }) {
  const body = item.summary || item.title
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block digest-item"
    >
      <p
        style={{
          color: 'var(--foreground)',
          margin: '0 0 0.5rem',
          fontSize: '16px',
          lineHeight: '24px',
          whiteSpace: 'pre-wrap',
        }}
      >
        {body}
      </p>
      <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
        {item.source_name}
        <span style={{ margin: '0 6px', opacity: 0.5 }}>·</span>
        {relativeDate(item.published_at)}
      </p>
    </a>
  )
}

function VideoCard({ video }: { video: Video }) {
  return (
    <a
      href={video.video_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-4 video-item"
    >
      {video.thumbnail_url && (
        <div
          className="flex-shrink-0 rounded-sm overflow-hidden relative"
          style={{ width: 160, height: 90 }}
        >
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            sizes="160px"
            className="object-cover"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p
          className="font-medium leading-snug line-clamp-2"
          style={{
            fontSize: '16px',
            color: 'var(--foreground)',
            marginBottom: '0.35rem',
          }}
        >
          {video.title}
        </p>
        <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
          {video.channel_name}
          <span style={{ margin: '0 6px', opacity: 0.5 }}>·</span>
          {relativeDate(video.published_at)}
        </p>
      </div>
    </a>
  )
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
