import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import {
  getLiveItems,
  getLiveItemsFresh,
  LIVE_REVALIDATE_SECONDS,
} from '@/lib/live-feeds'

export const revalidate = 300

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const groupId = searchParams.get('group_id')
  const limit = Math.min(Number(searchParams.get('limit') ?? 100) || 100, 300)
  const fresh = searchParams.get('fresh') === '1'

  try {
    let items = fresh ? await getLiveItemsFresh() : await getLiveItems()
    if (fresh) revalidateTag('live-feed-items', { expire: 0 })

    if (groupId) {
      items = items.filter((item) => item.group_id === groupId)
    }
    items = items.slice(0, limit)

    return NextResponse.json(
      { items },
      {
        headers: {
          'Cache-Control': fresh
            ? 'no-store'
            : `public, s-maxage=${LIVE_REVALIDATE_SECONDS}, stale-while-revalidate=${LIVE_REVALIDATE_SECONDS * 2}`,
        },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load feeds'
    return NextResponse.json({ error: message, items: [] }, { status: 500 })
  }
}
