import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { fetchRss, fetchBluesky } from '@/lib/fetch-feeds'

export async function POST(req: Request) {
  const guard = await checkAdminAuth()
  if (guard) return guard

  const { type, url, handle, name } = await req.json()

  const items =
    type === 'rss'
      ? await fetchRss(name, url)
      : await fetchBluesky(name, handle)

  if (items.length === 0) {
    return NextResponse.json({ ok: false, message: 'No items returned — feed may be unreachable or empty.' })
  }

  return NextResponse.json({
    ok: true,
    count: items.length,
    preview: items.slice(0, 3).map((i) => ({
      title: i.title,
      published: i.published,
      url: i.url,
      imageUrl: i.imageUrl,
    })),
  })
}
