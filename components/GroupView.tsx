'use client'

import { useState } from 'react'
import Image from 'next/image'
import ReaderSheet from './ReaderSheet'

interface DigestItem {
  title: string
  summary: string
  url: string
  source?: string
}

interface DigestSection {
  heading: string
  items: DigestItem[]
}

interface Video {
  id: string
  channel_id: string
  channel_name: string
  title: string
  thumbnail_url: string
  video_url: string
  published_at: string
  group_id?: string
}

interface Digest {
  date: string
  content: { sections?: DigestSection[]; raw?: string }
}

interface Props {
  groupName: string
  groupId: string
  digests: Digest[]
  videos: Video[]
}

type ListItem =
  | { kind: 'article'; item: DigestItem }
  | { kind: 'video'; video: Video }

export default function GroupView({ groupName, groupId, digests, videos }: Props) {
  const [index, setIndex] = useState(0)
  const [reader, setReader] = useState<{ url: string; title: string } | null>(null)

  if (digests.length === 0) {
    return (
      <div className="px-5 py-12 mx-auto text-center" style={{ maxWidth: '576px' }}>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          No content yet. Run the daily digest to populate this tab.
        </p>
      </div>
    )
  }

  const digest = digests[index] ?? null
  const hasPrev = index < digests.length - 1
  const hasNext = index > 0

  const section = digest?.content.sections?.find(
    (s) => s.heading.toLowerCase() === groupName.toLowerCase(),
  )
  const articles: DigestItem[] = section?.items ?? []

  // Show videos published within the 48h window ending at the selected digest date
  const digestEndMs = digest
    ? new Date(digest.date + 'T23:59:59').getTime()
    : Date.now()
  const windowMs = 48 * 60 * 60 * 1000
  const groupVideos = videos.filter((v) => {
    if (v.group_id !== groupId) return false
    const published = new Date(v.published_at).getTime()
    return published >= digestEndMs - windowMs && published <= digestEndMs
  })

  // Merge: articles first, then videos (no time sort needed)
  const listItems: ListItem[] = [
    ...articles.map((item): ListItem => ({ kind: 'article', item })),
    ...groupVideos.map((video): ListItem => ({ kind: 'video', video })),
  ]

  return (
    <>
      {reader && (
        <ReaderSheet
          url={reader.url}
          fallbackTitle={reader.title}
          onClose={() => setReader(null)}
        />
      )}

      <div className="px-5 py-6 mx-auto pb-[env(safe-area-inset-bottom)]" style={{ maxWidth: '576px' }}>
        {/* Date nav — only show if there are digests */}
        {digests.length > 0 && (
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setIndex((i) => i + 1)}
              disabled={!hasPrev}
              style={{
                background: 'none', border: 'none',
                cursor: hasPrev ? 'pointer' : 'default',
                color: hasPrev ? 'var(--foreground)' : 'var(--border)',
                padding: '4px 0', fontSize: '18px', lineHeight: 1,
              }}
              aria-label="Previous day"
            >←</button>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {digest ? formatDate(digest.date) : '—'}
            </p>
            <button
              onClick={() => setIndex((i) => i - 1)}
              disabled={!hasNext}
              style={{
                background: 'none', border: 'none',
                cursor: hasNext ? 'pointer' : 'default',
                color: hasNext ? 'var(--foreground)' : 'var(--border)',
                padding: '4px 0', fontSize: '18px', lineHeight: 1,
              }}
              aria-label="Next day"
            >→</button>
          </div>
        )}

        {listItems.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Nothing for this group today.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {listItems.map((entry, i) =>
            entry.kind === 'article' ? (
              <ArticleCard
                key={`a-${i}`}
                item={entry.item}
                onOpen={() => entry.item.url && setReader({ url: entry.item.url, title: entry.item.title })}
              />
            ) : (
              <VideoCard key={`v-${entry.video.id}`} video={entry.video} />
            ),
          )}
        </div>
      </div>
    </>
  )
}

function ArticleCard({ item, onOpen }: { item: DigestItem; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="block digest-item w-full text-left">
      <p className="font-medium leading-snug" style={{ marginBottom: '0.35rem', color: 'var(--foreground)', fontSize: '16px' }}>
        {item.title}
      </p>
      <p style={{ color: 'var(--muted)', margin: 0, fontSize: '16px', lineHeight: '24px' }}>
        {item.summary}
      </p>
    </button>
  )
}

function VideoCard({ video }: { video: Video }) {
  return (
    <a
      href={video.video_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 video-item"
    >
      {video.thumbnail_url && (
        <div className="flex-shrink-0 rounded-sm overflow-hidden relative" style={{ width: 128, height: 72 }}>
          <Image src={video.thumbnail_url} alt={video.title} fill sizes="128px" className="object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug line-clamp-2" style={{ color: 'var(--foreground)' }}>
          {video.title}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{video.channel_name}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{relativeDate(video.published_at)}</p>
      </div>
    </a>
  )
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
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
