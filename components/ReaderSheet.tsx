'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!mounted) return null

  return createPortal(
    <div className="reader-sheet">
      <header className="reader-sheet-bar">
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
      </header>

      <div className="reader-sheet-scroll">
        <div className="page-column" style={{ paddingTop: 40 }}>
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
              {article.siteName && (
                <p className="type-meta" style={{ margin: 0 }}>
                  {article.siteName}
                </p>
              )}
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
    </div>,
    document.body,
  )
}
