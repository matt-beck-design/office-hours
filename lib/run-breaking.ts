import Anthropic from '@anthropic-ai/sdk'
import { getSources } from './get-sources'
import { fetchRss, fetchBluesky, FeedItem } from './fetch-feeds'
import { supabaseAdmin } from './supabase'
import { sendPushToAll } from './push'

export interface BreakingResult {
  fired: boolean
  reason?: string
  summary?: string
}

export async function runBreakingNews(): Promise<BreakingResult> {
  const sources = await getSources()
  const db = supabaseAdmin()

  // ── 1. Fetch only breaking-tier sources ───────────────────────────────────
  const newItems: FeedItem[] = []

  await Promise.allSettled(
    sources.feeds.flatMap((group) =>
      group.breaking.map(async (src) => {
        const items =
          src.type === 'rss'
            ? await fetchRss(src.name, src.url!)
            : await fetchBluesky(src.name, src.handle!)
        newItems.push(...items)
      }),
    ),
  )

  if (newItems.length === 0) return { fired: false, reason: 'no items' }

  // ── 2. Filter out already-seen items ─────────────────────────────────────
  const ids = newItems.map((i) => i.id)
  const { data: seenRows } = await db.from('seen_items').select('item_id').in('item_id', ids)
  const seenSet = new Set((seenRows ?? []).map((r: { item_id: string }) => r.item_id))
  const unseen = newItems.filter((i) => !seenSet.has(i.id))

  await db.from('seen_items').upsert(
    newItems.map((i) => ({ item_id: i.id, source: i.source })),
    { onConflict: 'item_id,source' },
  )

  if (unseen.length === 0) return { fired: false, reason: 'nothing new' }

  // ── 3. Ask Claude to evaluate newsworthiness ──────────────────────────────
  const topicHints = sources.feeds.map((g) => g.topic).join('; ')
  const itemLines = unseen.map((i) => `- [${i.source}] ${i.title}: ${i.summary}`).join('\n')

  const client = new Anthropic()
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    system: `You evaluate whether a set of news items contains genuine breaking news worth an immediate push notification.
The user cares about: ${topicHints}.

Breaking news means: major announcements, significant leaks, industry-shaking events, urgent developments.
NOT breaking news: reviews, opinion pieces, rankings, weekly roundups, minor updates.

Respond with JSON only:
{ "breaking": true/false, "summary": "one sentence for the notification body (max 120 chars)" }

If breaking is false, summary can be empty string.`,
    messages: [{ role: 'user', content: itemLines }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
  let result: { breaking: boolean; summary: string }
  try {
    result = JSON.parse(raw)
  } catch {
    return { fired: false, reason: 'parse error' }
  }

  if (!result.breaking) return { fired: false, reason: 'not breaking' }

  await sendPushToAll('Breaking News', result.summary, '/')
  return { fired: true, summary: result.summary }
}
