import Anthropic from '@anthropic-ai/sdk'
import { getSources } from './get-sources'
import { fetchRss, fetchBluesky, fetchYouTubeChannel, FeedItem } from './fetch-feeds'
import { supabaseAdmin } from './supabase'
import { sendPushToAll } from './push'

export async function runDailyDigest(): Promise<{ date: string }> {
  const sources = await getSources()
  const today = new Date().toISOString().slice(0, 10)
  const db = supabaseAdmin()

  // ── 1. Fetch all feeds ─────────────────────────────────────────────────────
  const allItems: Array<{ group: string; topic: string; items: FeedItem[] }> = []

  for (const group of sources.feeds) {
    const groupItems: FeedItem[] = []
    const allSources = [...group.breaking, ...group.daily]
    await Promise.allSettled(
      allSources.map(async (src) => {
        const items =
          src.type === 'rss'
            ? await fetchRss(src.name, src.url!)
            : await fetchBluesky(src.name, src.handle!)
        groupItems.push(...items)
      }),
    )
    const seen = new Set<string>()
    const deduped = groupItems
      .filter((i) => {
        if (seen.has(i.id)) return false
        seen.add(i.id)
        return true
      })
      .sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime())
      .slice(0, 40)

    allItems.push({ group: group.name, topic: group.topic, items: deduped })
  }

  // ── 2. Fetch YouTube videos ────────────────────────────────────────────────
  if (sources.youtube.length > 0) {
    const videoItems = await Promise.all(
      sources.youtube.map((ch) => fetchYouTubeChannel(ch.channelId, ch.name)),
    )
    const allVideos = videoItems.flat()
    if (allVideos.length > 0) {
      await db.from('videos').upsert(
        allVideos.map((v) => ({
          channel_id: v.channelId,
          channel_name: v.channelName,
          title: v.title,
          thumbnail_url: v.thumbnailUrl,
          video_url: v.videoUrl,
          published_at: v.publishedAt,
        })),
        { onConflict: 'channel_id,video_url' },
      )
    }
  }

  // ── 3. Build Claude prompt ─────────────────────────────────────────────────
  const feedContext = allItems
    .map(({ group, topic, items }) => {
      const itemLines = items.map((i) => `- [${i.source}] ${i.title}: ${i.summary}`).join('\n')
      return `## ${group} (topic hint: ${topic})\n${itemLines}`
    })
    .join('\n\n')

  const client = new Anthropic()
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: `You are a personal news digest writer. Given a set of feed items grouped by topic, write a calm, well-organized daily digest.

Return a JSON object with this shape:
{
  "date": "YYYY-MM-DD",
  "sections": [
    {
      "heading": "string",
      "items": [
        { "title": "string", "summary": "string (2-3 sentences)", "url": "string" }
      ]
    }
  ]
}

Rules:
- Infer category headings from the actual content, not the feed group names
- Combine related stories across sources — don't repeat the same story
- Skip trivial posts, listicles, and non-news content
- Be concise and factual — no hype, no clickbait rewrites
- Only include items from the last 24 hours when possible
- Return valid JSON only, no markdown fences`,
    messages: [
      { role: 'user', content: `Today is ${today}. Here are the feed items:\n\n${feedContext}` },
    ],
  })

  const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
  let digestContent: object
  try {
    digestContent = JSON.parse(rawText)
  } catch {
    digestContent = { date: today, raw: rawText, sections: [] }
  }

  await db.from('digests').upsert({ date: today, content: digestContent }, { onConflict: 'date' })
  await sendPushToAll('Your digest is ready', `Office Hours — ${today}`, '/')

  return { date: today }
}
