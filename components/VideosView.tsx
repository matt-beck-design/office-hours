'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface Video {
  id: string
  channel_id: string
  channel_name: string
  title: string
  thumbnail_url: string
  video_url: string
  published_at: string
}

export default function VideosView() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/videos')
      .then((r) => r.json())
      .then(({ videos }) => {
        setVideos(videos ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="px-5 py-6 max-w-2xl mx-auto space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <div
              className="w-32 h-[72px] rounded-sm flex-shrink-0 animate-pulse"
              style={{ background: 'var(--border)' }}
            />
            <div className="flex-1 space-y-2 pt-1">
              <div
                className="h-3 rounded animate-pulse"
                style={{ background: 'var(--border)', width: '85%' }}
              />
              <div
                className="h-3 rounded animate-pulse"
                style={{ background: 'var(--border)', width: '60%' }}
              />
              <div
                className="h-3 rounded animate-pulse"
                style={{ background: 'var(--border)', width: '40%' }}
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="px-5 py-12 max-w-2xl mx-auto text-center">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          No videos yet. Add YouTube channels to <code>sources.config.js</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="px-5 py-6 max-w-2xl mx-auto pb-[env(safe-area-inset-bottom)]">
      <div className="flex flex-col gap-5">
        {videos.map((video) => (
          <a
            key={video.id}
            href={video.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-3"
          >
            {video.thumbnail_url && (
              <div className="w-32 h-[72px] flex-shrink-0 rounded-sm overflow-hidden relative">
                <Image
                  src={video.thumbnail_url}
                  alt={video.title}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium leading-snug line-clamp-2"
                style={{ color: 'var(--foreground)' }}
              >
                {video.title}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                {video.channel_name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                {relativeDate(video.published_at)}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
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
