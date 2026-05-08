'use client'

import { useEffect, useState } from 'react'
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

interface Digest {
  id: string
  date: string
  content: {
    date?: string
    sections?: DigestSection[]
    raw?: string
  }
}

export default function DigestView() {
  const [digests, setDigests] = useState<Digest[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [reader, setReader] = useState<{ url: string; title: string } | null>(null)

  useEffect(() => {
    fetch('/api/digest')
      .then((r) => r.json())
      .then(({ digests }) => {
        setDigests(digests ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

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

  if (digests.length === 0) {
    return (
      <div className="px-5 py-12 mx-auto text-center" style={{ maxWidth: '576px' }}>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          No digest yet. The daily cron runs at 7am PT.
        </p>
      </div>
    )
  }

  const digest = digests[index]
  const { content } = digest
  const sections: DigestSection[] = content.sections ?? []
  const hasPrev = index < digests.length - 1
  const hasNext = index > 0

  return (
    <>
      {reader && (
        <ReaderSheet
          url={reader.url}
          fallbackTitle={reader.title}
          onClose={() => setReader(null)}
        />
      )}

      <article className="px-5 py-6 mx-auto pb-[env(safe-area-inset-bottom)]" style={{ maxWidth: '576px' }}>
        {/* Date nav */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setIndex((i) => i + 1)}
            disabled={!hasPrev}
            style={{
              background: 'none',
              border: 'none',
              cursor: hasPrev ? 'pointer' : 'default',
              color: hasPrev ? 'var(--foreground)' : 'var(--border)',
              padding: '4px 0',
              fontSize: '18px',
              lineHeight: 1,
            }}
            aria-label="Previous day"
          >
            ←
          </button>

          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {formatDate(digest.date)}
          </p>

          <button
            onClick={() => setIndex((i) => i - 1)}
            disabled={!hasNext}
            style={{
              background: 'none',
              border: 'none',
              cursor: hasNext ? 'pointer' : 'default',
              color: hasNext ? 'var(--foreground)' : 'var(--border)',
              padding: '4px 0',
              fontSize: '18px',
              lineHeight: 1,
            }}
            aria-label="Next day"
          >
            →
          </button>
        </div>

        {sections.length === 0 && content.raw && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            {content.raw}
          </p>
        )}

        <div className="prose-digest">
          {sections.map((section, si) => (
            <section key={si} style={{ marginBottom: '2.5rem' }}>
              <h2>{section.heading}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {section.items.map((item, ii) => (
                  <div key={ii}>
                    {item.url ? (
                      <button
                        onClick={() => setReader({ url: item.url, title: item.title })}
                        className="block digest-item w-full text-left"
                      >
                        <p className="font-medium leading-snug" style={{ marginBottom: '0.35rem', fontFamily: 'inherit', color: 'var(--foreground)' }}>
                          {item.title}
                        </p>
                        <p style={{ color: 'var(--muted)', margin: 0, fontSize: '16px', lineHeight: '24px' }}>
                          {item.summary}
                        </p>
                      </button>
                    ) : (
                      <div className="digest-item">
                        <p className="font-medium leading-snug" style={{ marginBottom: '0.35rem', fontFamily: 'inherit', color: 'var(--foreground)' }}>
                          {item.title}
                        </p>
                        <p style={{ color: 'var(--muted)', margin: 0, fontSize: '16px', lineHeight: '24px' }}>
                          {item.summary}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </>
  )
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}
