'use client'

import { useEffect, useState } from 'react'

interface ReaderArticle {
  title: string
  byline?: string
  siteName?: string
  content: string
}

interface Props {
  url: string
  fallbackTitle: string
  onClose: () => void
}

export default function ReaderSheet({ url, fallbackTitle, onClose }: Props) {
  const [article, setArticle] = useState<ReaderArticle | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    setArticle(null)
    setError(false)
    fetch(`/api/reader?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(true)
        else setArticle(data)
      })
      .catch(() => setError(true))
  }, [url])

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          paddingTop: 'max(16px, env(safe-area-inset-top))',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          background: 'var(--background)',
          zIndex: 1,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--foreground)',
            fontSize: '17px',
            cursor: 'pointer',
            padding: '4px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ← Back
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--muted)',
            fontSize: '13px',
            textDecoration: 'none',
          }}
        >
          Open ↗
        </a>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '576px', margin: '0 auto', width: '100%', padding: '32px 20px 64px' }}>
        {!article && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[100, 70, 85, 60, 90, 75].map((w, i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{ height: '16px', borderRadius: '4px', background: 'var(--border)', width: `${w}%` }}
              />
            ))}
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', paddingTop: '48px' }}>
            <p style={{ color: 'var(--muted)', fontSize: '15px', marginBottom: '16px' }}>
              Couldn't load article — this site may block external readers.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--foreground)', fontSize: '15px' }}
            >
              Open in browser ↗
            </a>
          </div>
        )}

        {article && (
          <>
            {article.siteName && (
              <p style={{ color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                {article.siteName}
              </p>
            )}
            <h1 style={{ color: 'var(--foreground)', fontSize: '22px', lineHeight: '28px', fontWeight: 600, marginBottom: '12px' }}>
              {article.title}
            </h1>
            {article.byline && (
              <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '28px' }}>
                {article.byline}
              </p>
            )}
            <div
              className="reader-content"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </>
        )}
      </div>
    </div>
  )
}
