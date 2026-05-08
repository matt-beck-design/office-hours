import Anthropic from '@anthropic-ai/sdk'
import { getSources } from './get-sources'
import { fetchRss, fetchBluesky, fetchYouTubeChannel, FeedItem } from './fetch-feeds'
import { supabaseAdmin } from './supabase'
import { sendPushToAll } from './push'

export async function runDailyDigest(): Promise<{ date: string }> {
  const sources = await getSources()
  const today = new Date().toISOString().slice(0, 10)
  const db = supabaseAdmin()

  // ── 1. Fetch feeds, YouTube, and settings all in parallel ──────────────────
  const [allItems, , bioRow, groupRows] = await Promise.all([
    // Feed groups — all groups fetched in parallel
    Promise.all(
      sources.feeds.map(async (group) => {
        const groupItems: FeedItem[] = []
        await Promise.allSettled(
          [...group.breaking, ...group.daily].map(async (src) => {
            const items =
              src.type === 'rss'
                ? await fetchRss(src.name, src.url!)
                : await fetchBluesky(src.name, src.handle!)
            groupItems.push(...items)
          }),
        )
        const seen = new Set<string>()
        const deduped = groupItems
          .filter((i) => { if (seen.has(i.id)) return false; seen.add(i.id); return true })
          .sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime())
          .slice(0, 25)
        return { group: group.name, topic: group.topic, items: deduped }
      }),
    ),

    // YouTube videos
    (async () => {
      if (sources.youtube.length === 0) return
      const channelToGroup = new Map(sources.youtube.map((ch) => [ch.channelId, ch.groupId ?? null]))
      const allVideos = (await Promise.all(
        sources.youtube.map((ch) => fetchYouTubeChannel(ch.channelId, ch.name)),
      )).flat()
      if (allVideos.length > 0) {
        await db.from('videos').upsert(
          allVideos.map((v) => ({
            channel_id: v.channelId,
            channel_name: v.channelName,
            title: v.title,
            thumbnail_url: v.thumbnailUrl,
            video_url: v.videoUrl,
            published_at: v.publishedAt,
            group_id: channelToGroup.get(v.channelId) ?? null,
          })),
          { onConflict: 'channel_id,video_url' },
        )
      }
    })(),

    // User bio
    db.from('settings').select('value').eq('key', 'user_bio').single().then((r) => r.data),

    // Group contexts
    db.from('feed_groups').select('name, context').then((r) => r.data),
  ])

  // ── 2. Build Claude prompt ─────────────────────────────────────────────────
  const userBio = bioRow?.value ?? ''
  const groupContextMap = new Map((groupRows ?? []).map((g) => [g.name, g.context as string | null]))
  const groupNames = allItems.map(({ group }) => group)

  const feedContext = allItems
    .map(({ group, topic, items }) => {
      const context = groupContextMap.get(group)
      const meta = [topic && `topic: ${topic}`, context && `context: ${context}`].filter(Boolean).join(' | ')
      const itemLines = items.map((i) => `- [${i.source}] ${i.title}: ${i.summary.slice(0, 200)} (published: ${i.published.slice(0, 10)}, url: ${i.url})`).join('\n')
      return `## ${group}${meta ? ` (${meta})` : ''}\n${itemLines}`
    })
    .join('\n\n')

  const bioSection = userBio ? `About the reader:\n${userBio}\n\n` : ''

  const client = new Anthropic()
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
    system: `You are writing a daily news digest for a single reader.

${bioSection}Your job is to be the smart friend who read everything so they don't have to — and tells them what's actually going on, not just what happened.

Return a JSON object with this shape:
{
  "date": "YYYY-MM-DD",
  "sections": [
    {
      "heading": "string",
      "note": "string — Write this like a trusted personal assistant delivering a morning briefing. Warm and direct. Use the reader's name if you know it from the bio. Look for the through-line or common theme across the stories in this group and lead with that. What is today actually about for this topic? What connects these stories? Then note anything that stands out personally for this reader. 3-5 sentences. Keep sentences short and punchy. No em dashes, no hyphens used as dashes. Never use the words: signal, noise, quiet, nuance, dive, unpack, landscape, space, ecosystem. Sound like a person talking, not a writer writing.",
      "items": [
        { "title": "string", "summary": "string", "url": "string", "source": "string" }
      ]
    }
  ]
}

Rules:
- Use the exact feed group names provided as section headings — do not invent or rename them
- Use any group context provided to filter and prioritize — it tells you what this reader cares about in that group
- Combine related stories across sources into one item — if five outlets covered the same announcement, that's one entry, not five
- Write summaries the way a thoughtful person would explain something to a friend: direct, a little dry, no throat-clearing
- If a rumor comes from a reliable insider, say so. If it's thin, say it's thin
- No em dashes or hyphens used as dashes. Short sentences. No AI jargon: signal, noise, nuance, dive, unpack, landscape, ecosystem, space
- Skip: listicles, reviews, deals posts, YouTube thumbnail bait, anything that's just reacting to a tweet with no new information
- Rumors and confirmed news should feel distinct — don't present speculation with the same weight as a press release
- Each feed item includes a url — always use the exact provided url, never construct or guess one
- Items are pre-sorted by recency — include anything relevant, prioritise the most recent
- Aim for 5-8 items per section — don't truncate if there's genuinely good material
- Write summaries at 3-5 sentences — enough to give real context, not just a restatement of the headline
- Return valid JSON only, no markdown fences`,
    messages: [
      { role: 'user', content: `Today is ${today}. Feed group names (use these EXACTLY as section headings): ${groupNames.join(', ')}.\n\nHere are the feed items:\n\n${feedContext}` },
    ],
  })

  const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
  let digestContent: object
  try {
    // Strip markdown fences if present, then find outermost JSON object
    const stripped = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    const start = stripped.indexOf('{')
    const end = stripped.lastIndexOf('}')
    const jsonStr = start !== -1 && end !== -1 ? stripped.slice(start, end + 1) : stripped
    digestContent = JSON.parse(jsonStr)
  } catch {
    digestContent = { date: today, raw: rawText, sections: [] }
  }

  await db.from('digests').upsert({ date: today, content: digestContent }, { onConflict: 'date' })
  await sendPushToAll('Your digest is ready', `Office Hours — ${today}`, '/')

  return { date: today }
}
