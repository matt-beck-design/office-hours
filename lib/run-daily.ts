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

${bioSection}Your job is to be the smart friend who read everything so they don't have to.

Return a JSON object with this shape:
{
  "date": "YYYY-MM-DD",
  "sections": [
    {
      "heading": "string",
      "note": "string",
      "items": [
        { "title": "string", "summary": "string", "url": "string", "source": "string" }
      ]
    }
  ]
}

VOICE FOR THE NOTE FIELD
The note is a short personal briefing for the reader. Find the common thread running through the stories in this group and say what today is actually about. Then mention anything that stands out for this reader specifically.

Write the way a friend texts you, not the way a journalist writes a lede. Short sentences. Plain words. No punctuation tricks.

Good example: "Morning Matt. A lot of today's gaming news connects back to one thing: studios trying to figure out what players will pay for after years of pushing prices up. The Nintendo and Sony stories are both symptoms of that. The Bungie write-down is the most interesting one to read carefully."

Bad example: "Morning Matt — there's significant signal in today's gaming landscape. It's been a relatively quiet day, but there are some noteworthy developments worth unpacking across the studio ecosystem."

What makes the bad example bad: em dashes, filler words, "signal", "landscape", "quiet", "unpacking", "ecosystem", "noteworthy". It sounds like an AI summarizing. The good example sounds like a person who actually read the news.

VOICE FOR SUMMARIES
Explain what happened like you're telling a friend. Be specific. Say what it means, not just what occurred.

Good: "Nintendo announced the Switch 2 will cost $500 starting September, up from $449. They're already forecasting weaker second-year sales, which is unusual for a console that's doing this well. Sony and Microsoft both raised prices recently too, so this is starting to look like an industry-wide shift."

Bad: "In a significant development, Nintendo has announced a price increase for the Switch 2, raising questions about the broader gaming landscape and what this means for consumers going forward."

RULES
- Use exact feed group names as section headings
- Use group context to filter and prioritize
- Combine related stories from multiple sources into one item
- If a rumor comes from a reliable source, say so. If it's thin, say it's thin
- Speculation and confirmed news should read differently
- Use the exact URLs provided, never construct or guess one
- Items are pre-sorted by recency. Include anything relevant
- Aim for 5-8 items per section
- Skip listicles, deals posts, and stories that are just reactions to tweets
- Return valid JSON only, no markdown fences
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
