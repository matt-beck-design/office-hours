'use client'

import { useEffect, useState } from 'react'

const IDLE  = ['  /) /)', '( •ᴗ• )']
const BLINK = ['  /) /)', '( –ᴗ– )']
const WINK  = ['  /) /)', '( •ᴗ– )']

interface Props {
  note?: string
  groupName: string
  date: string
}

export default function AssistantNote({ note, groupName, date }: Props) {
  const [frame, setFrame] = useState(IDLE)

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>
    let t2: ReturnType<typeof setTimeout>
    let count = 0

    function scheduleBlink() {
      const delay = 2500 + Math.random() * 3000
      t1 = setTimeout(() => {
        count++
        setFrame(count % 5 === 0 ? WINK : BLINK)
        t2 = setTimeout(() => {
          setFrame(IDLE)
          scheduleBlink()
        }, 150)
      }, delay)
    }

    scheduleBlink()
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div style={{ padding: '0 16px', marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
        <pre style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--foreground)', margin: 0, lineHeight: 1.5, flexShrink: 0 }}>
          {frame[0]}{'\n'}{frame[1]}
        </pre>
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', margin: 0, lineHeight: 1.3 }}>
          {groupName} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>— {date}</span>
        </p>
      </div>
      {note && (
        <p style={{ fontSize: '15px', lineHeight: '24px', color: 'var(--muted)', margin: 0 }}>
          {note}
        </p>
      )}
    </div>
  )
}
