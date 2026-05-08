'use client'

import { useEffect, useState } from 'react'

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
  const [digest, setDigest] = useState<Digest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/digest')
      .then((r) => r.json())
      .then(({ digest }) => {
        setDigest(digest)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="px-5 py-8 max-w-2xl mx-auto">
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-4 rounded animate-pulse"
              style={{
                background: 'var(--border)',
                width: `${60 + (i % 3) * 15}%`,
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (!digest) {
    return (
      <div className="px-5 py-12 max-w-2xl mx-auto text-center">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          No digest yet. The daily cron runs at 7am PT.
        </p>
      </div>
    )
  }

  const { content } = digest
  const sections: DigestSection[] = content.sections ?? []

  return (
    <article className="px-5 py-6 max-w-2xl mx-auto pb-[env(safe-area-inset-bottom)]">
      <p className="text-xs mb-6" style={{ color: 'var(--muted)' }}>
        {formatDate(digest.date)}
      </p>

      {sections.length === 0 && content.raw && (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
          {content.raw}
        </p>
      )}

      <div className="prose-digest">
        {sections.map((section, si) => (
          <section key={si} style={{ marginBottom: '2.5rem' }}>
            <h2>{section.heading}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {section.items.map((item, ii) => (
                <div key={ii}>
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <p className="font-medium leading-snug" style={{ marginBottom: '0.35rem', fontFamily: 'inherit' }}>{item.title}</p>
                      <p className="leading-relaxed" style={{ color: 'var(--muted)', margin: 0 }}>
                        {item.summary}
                      </p>
                      {item.source && (
                        <p style={{ fontSize: '0.7rem', marginTop: '0.4rem', color: 'var(--muted)', opacity: 0.6, fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif', letterSpacing: '0.03em' }}>{item.source}</p>
                      )}
                    </a>
                  ) : (
                    <div>
                      <p className="font-medium leading-snug" style={{ marginBottom: '0.35rem', fontFamily: 'inherit' }}>{item.title}</p>
                      <p className="leading-relaxed" style={{ color: 'var(--muted)', margin: 0 }}>
                        {item.summary}
                      </p>
                      {item.source && (
                        <p style={{ fontSize: '0.7rem', marginTop: '0.4rem', color: 'var(--muted)', opacity: 0.6, fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif', letterSpacing: '0.03em' }}>{item.source}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  )
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}
