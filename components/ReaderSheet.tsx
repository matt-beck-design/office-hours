'use client'

import { useEffect, useState } from 'react'

interface ReaderArticle {
  title: string
  byline?: string
  siteName?: string
  content: string
}

interface ReaderError {
  error: string
  status?: number
}

interface Props {
  url: string
  fallbackTitle: string
  onClose: () => void
}

export default function ReaderSheet({ url, fallbackTitle, onClose }: Props) {
  const [article, setArticle] = useState<ReaderArticle | null>(null)
  const [error, setError] = useState<ReaderError | null>(null)

  useEffect(() => {
    setArticle(null)
    setError(null)
    fetch(`/api/reader?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError({ error: data.error, status: data.status })
        else setArticle(data)
      })
      .catch((e) => setError({ error: e.message ?? 'Network error' }))
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px var(--gutter)',
          paddingTop: 'max(20px, env(safe-area-inset-top))',
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
          className="type-nav"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--foreground)',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Back
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="type-meta"
          style={{ textDecoration: 'none' }}
        >
          Open
        </a>
      </div>

      <div
        style={{
          maxWidth: 'var(--column)',
          margin: '0 auto',
          width: '100%',
          padding: '48px var(--gutter) calc(64px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {!article && !error && (
          <div className="cluster" style={{ gap: 12 }}>
            {[100, 70, 85, 60, 90, 75].map((w, i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{ height: 14, background: 'var(--border)', width: `${w}%` }}
              />
            ))}
          </div>
        )}

        {error && (
          <div style={{ paddingTop: 48 }}>
            <p className="type-body" style={{ margin: '0 0 20px' }}>
              {error.error === 'blocked'
                ? 'This site requires a real browser — it blocks server-side readers.'
                : error.error === 'parse_failed'
                  ? "Article content couldn't be extracted from this page."
                  : "Couldn't load this article."}
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="type-nav"
              style={{ color: 'var(--foreground)' }}
            >
              Open in browser
            </a>
          </div>
        )}

        {article && (
          <div className="cluster" style={{ gap: 'var(--space-tight)' }}>
            {article.siteName && <p className="type-meta" style={{ margin: 0 }}>{article.siteName}</p>}
            <h1 className="type-title" style={{ margin: 0 }}>
              {article.title || fallbackTitle}
            </h1>
            {article.byline && (
              <p className="type-meta" style={{ margin: '4px 0 0' }}>
                {article.byline}
              </p>
            )}
            <div
              className="reader-content"
              style={{ marginTop: 36 }}
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
