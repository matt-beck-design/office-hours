'use client'

import { useState } from 'react'
import DigestView from '@/components/DigestView'
import VideosView from '@/components/VideosView'
import PushManager from '@/components/PushManager'

type Tab = 'digest' | 'videos'

export default function Home() {
  const [tab, setTab] = useState<Tab>('digest')

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top)] pb-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <span
          className="text-sm font-medium py-4 tracking-wide"
          style={{ color: 'var(--muted)' }}
        >
          Office Hours
        </span>
        <PushManager />
      </header>

      {/* Tab bar */}
      <nav
        className="flex gap-0 px-5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {(['digest', 'videos'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="py-3 px-1 mr-5 text-sm font-medium transition-colors"
            style={{
              color: tab === t ? 'var(--foreground)' : 'var(--muted)',
              borderBottom: tab === t ? '2px solid var(--foreground)' : '2px solid transparent',
              marginBottom: '-1px',
              background: 'none',
              cursor: 'pointer',
            }}
          >
            {t === 'digest' ? 'Digest' : 'Videos'}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {tab === 'digest' ? <DigestView /> : <VideosView />}
      </main>
    </div>
  )
}
