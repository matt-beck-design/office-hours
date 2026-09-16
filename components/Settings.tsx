'use client'

import PushManager from './PushManager'

export default function Settings() {
  return (
    <div className="page-column">
      <div className="cluster" style={{ gap: 12 }}>
        <p className="type-meta" style={{ margin: 0 }}>
          Notifications
        </p>
        <PushManager />
      </div>
    </div>
  )
}
