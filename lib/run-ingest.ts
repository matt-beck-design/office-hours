import { getSources } from './get-sources'
import { fetchRss, fetchBluesky, fetchYouTubeChannel, FeedItem } from './fetch-feeds'
import { supabaseAdmin } from './supabase'

export interface IngestResult {
  itemsUpserted: number
  videosUpserted: number
  groups: number
}

export async function runIngest(): Promise<IngestResult> {
  const sources = await getSources()
  const db = supabaseAdmin()

  const [feedResults, videoCount] = await Promise.all([
    // Feed items per group
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
        const deduped = groupItems.filter((i) => {
          const key = `${i.source}::${i.id}`
          if (!i.id || !i.url || seen.has(key)) return false
          seen.add(key)
          return true
        })

        if (deduped.length === 0 || !group.id) return 0

        const { error } = await db.from('feed_items').upsert(
          deduped.map((i) => ({
            external_id: i.id,
            group_id: group.id,
            source_name: i.source,
            source_type: i.sourceType,
            title: i.title || '(untitled)',
            url: i.url,
            summary: i.summary || null,
            published_at: i.published,
          })),
          { onConflict: 'external_id,source_name' },
        )

        if (error) {
          console.error(`ingest upsert failed for group ${group.name}:`, error.message)
          return 0
        }
        return deduped.length
      }),
    ),

    // YouTube
    (async () => {
      if (sources.youtube.length === 0) return 0
      const channelToGroup = new Map(sources.youtube.map((ch) => [ch.channelId, ch.groupId ?? null]))
      const allVideos = (
        await Promise.all(
          sources.youtube.map((ch) => fetchYouTubeChannel(ch.channelId, ch.name)),
        )
      ).flat()
      if (allVideos.length === 0) return 0
      const { error } = await db.from('videos').upsert(
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
      if (error) {
        console.error('ingest youtube upsert failed:', error.message)
        return 0
      }
      return allVideos.length
    })(),
  ])

  return {
    itemsUpserted: feedResults.reduce((a, b) => a + b, 0),
    videosUpserted: videoCount,
    groups: sources.feeds.length,
  }
}
