import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { fetchYouTubeChannel } from '@/lib/fetch-feeds'

export async function POST(req: Request) {
  const guard = await checkAdminAuth()
  if (guard) return guard

  const { channelId, name } = await req.json()

  try {
    const items = await fetchYouTubeChannel(channelId, name)
    if (items.length === 0) {
      return NextResponse.json({
        ok: false,
        message: 'No videos returned — channel ID may be wrong or feed unreachable.',
        feedUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      })
    }
    return NextResponse.json({
      ok: true,
      count: items.length,
      preview: items.slice(0, 3).map((v) => ({ title: v.title, publishedAt: v.publishedAt, videoUrl: v.videoUrl })),
    })
  } catch (err) {
    return NextResponse.json({ ok: false, message: String(err) })
  }
}
