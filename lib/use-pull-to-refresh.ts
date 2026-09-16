'use client'

import { RefObject, useEffect, useRef, useState } from 'react'

const PULL_THRESHOLD = 64
const MAX_PULL = 96
const RESISTANCE = 0.42

interface Options {
  onRefresh: () => Promise<void>
  disabled?: boolean
}

export function usePullToRefresh(
  scrollRef: RefObject<HTMLElement | null>,
  { onRefresh, disabled = false }: Options,
) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const pullRef = useRef(0)
  const startY = useRef(0)
  const tracking = useRef(false)
  const onRefreshRef = useRef(onRefresh)
  const disabledRef = useRef(disabled)
  const refreshingRef = useRef(false)

  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  useEffect(() => {
    disabledRef.current = disabled
  }, [disabled])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    function onTouchStart(e: TouchEvent) {
      if (disabledRef.current || refreshingRef.current) return
      if (el!.scrollTop > 0) {
        tracking.current = false
        return
      }
      startY.current = e.touches[0].clientY
      tracking.current = true
    }

    function onTouchMove(e: TouchEvent) {
      if (!tracking.current || disabledRef.current || refreshingRef.current) return
      if (el!.scrollTop > 0) {
        tracking.current = false
        setPull(0)
        pullRef.current = 0
        return
      }

      const delta = e.touches[0].clientY - startY.current
      if (delta <= 0) {
        setPull(0)
        pullRef.current = 0
        return
      }

      // Claim the gesture once the pull is intentional so the scroll
      // container does not fight the rubber-band indicator.
      if (delta > 8) e.preventDefault()

      const next = Math.min(MAX_PULL, delta * RESISTANCE)
      pullRef.current = next
      setPull(next)
    }

    async function onTouchEnd() {
      if (!tracking.current) return
      tracking.current = false

      const shouldRefresh = pullRef.current >= PULL_THRESHOLD && !refreshingRef.current
      if (!shouldRefresh) {
        setPull(0)
        pullRef.current = 0
        return
      }

      refreshingRef.current = true
      setRefreshing(true)
      setPull(PULL_THRESHOLD)
      pullRef.current = PULL_THRESHOLD

      try {
        await onRefreshRef.current()
      } finally {
        refreshingRef.current = false
        setRefreshing(false)
        setPull(0)
        pullRef.current = 0
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [scrollRef])

  return { pull, refreshing, threshold: PULL_THRESHOLD }
}
