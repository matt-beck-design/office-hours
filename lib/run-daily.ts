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
      .slice(0, 60)

    allItems.push({ group: group.name, topic: group.topic, items: deduped })
  }

  // ── 2. Fetch YouTube videos ────────────────────────────────────────────────
  if (sources.youtube.length > 0) {
    const channelToGroup = new Map(sources.youtube.map((ch) => [ch.channelId, ch.groupId ?? null]))
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
          group_id: channelToGroup.get(v.channelId) ?? null,
        })),
        { onConflict: 'channel_id,video_url' },
      )
    }
  }

  // ── 3. Fetch user bio and group contexts ───────────────────────────────────
  const { data: bioRow } = await db.from('settings').select('value').eq('key', 'user_bio').single()
  const userBio = bioRow?.value ?? ''

  const { data: groupRows } = await db.from('feed_groups').select('name, context')
  const groupContextMap = new Map((groupRows ?? []).map((g) => [g.name, g.context as string | null]))

  // ── 4. Build Claude prompt ─────────────────────────────────────────────────
  const groupNames = allItems.map(({ group }) => group)

  const feedContext = allItems
    .map(({ group, topic, items }) => {
      const context = groupContextMap.get(group)
      const meta = [topic && `topic: ${topic}`, context && `context: ${context}`].filter(Boolean).join(' | ')
      const itemLines = items.map((i) => `- [${i.source}] ${i.title}: ${i.summary} (url: ${i.url})`).join('\n')
      return `## ${group}${meta ? ` (${meta})` : ''}\n${itemLines}`
    })
    .join('\n\n')

  const bioSection = userBio ? `About the reader:\n${userBio}\n\n` : ''

  const client = new Anthropic()
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: `You are writing a daily news digest for a single reader.

${bioSection}Your job is to be the smart friend who read everything so they don't have to — and tells them what's actually going on, not just what happened.

Return a JSON object with this shape:
{
  "date": "YYYY-MM-DD",
  "sections": [
    {
      "heading": "string",
      "note": "string — 1-3 sentences in a direct, personal voice. Give the reader a topline read of what's happening in this group today and what it means for them specifically, informed by their bio and any group context provided. Write it like a message to a friend: casual, direct, no throat-clearing. Use an empty string if nothing notable happened.",
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
- Flag the signal-to-noise ratio honestly — if a rumor comes from a reliable insider, say so. If it's thin, say it's thin
- Skip: listicles, reviews, deals posts, YouTube thumbnail bait, anything that's just reacting to a tweet with no new information
- Rumors and confirmed news should feel distinct — don't present speculation with the same weight as a press release
- Each feed item includes a url — always use the exact provided url, never construct or guess one
- Include items from the last 48 hours
- Aim for 5-8 items per section — don't truncate if there's genuinely good material
- Write summaries at 3-5 sentences — enough to give real context, not just a restatement of the headline
- Return valid JSON only, no markdown fences`,
    messages: [
      { role: 'user', content: `Today is ${today}. Feed group names (use these EXACTLY as section headings): ${groupNames.join(', ')}.\n\nHere are the feed items:\n\n${feedContext}` },
    ],
  })

  const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
  const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  let digestContent: object
  try {
    digestContent = JSON.parse(cleaned)
  } catch {
    digestContent = { date: today, raw: rawText, sections: [] }
  }

  await db.from('digests').upsert({ date: today, content: digestContent }, { onConflict: 'date' })
  await sendPushToAll('Your digest is ready', `Office Hours — ${today}`, '/')

  return { date: today }
}
