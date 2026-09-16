import { NextResponse } from 'next/server'
import { getLiveVideos, LIVE_REVALIDATE_SECONDS } from '@/lib/live-feeds'

export const revalidate = 300

export async function GET() {
  try {
    const videos = (await getLiveVideos()).slice(0, 200)
    return NextResponse.json(
      { videos },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${LIVE_REVALIDATE_SECONDS}, stale-while-revalidate=${LIVE_REVALIDATE_SECONDS * 2}`,
        },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load videos'
    return NextResponse.json({ error: message, videos: [] }, { status: 500 })
  }
}
