import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import {
  getLiveVideos,
  getLiveVideosFresh,
  LIVE_REVALIDATE_SECONDS,
} from '@/lib/live-feeds'

export const revalidate = 300

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const fresh = searchParams.get('fresh') === '1'

  try {
    const videos = (
      fresh ? await getLiveVideosFresh() : await getLiveVideos()
    ).slice(0, 200)

    if (fresh) revalidateTag('live-feed-videos', { expire: 0 })

    return NextResponse.json(
      { videos },
      {
        headers: {
          'Cache-Control': fresh
            ? 'no-store'
            : `public, s-maxage=${LIVE_REVALIDATE_SECONDS}, stale-while-revalidate=${LIVE_REVALIDATE_SECONDS * 2}`,
        },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load videos'
    return NextResponse.json({ error: message, videos: [] }, { status: 500 })
  }
}
