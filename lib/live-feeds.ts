import { unstable_cache } from 'next/cache'
import { getSources, SourceConfig } from './get-sources'
import { fetchRss, fetchYouTubeChannel, FeedItem } from './fetch-feeds'

export interface LiveFeedItem {
  id: string
  external_id: string
  group_id: string | null
  source_name: string
  source_type: 'rss' | 'bluesky'
  title: string
  url: string
  summary: string | null
  image_url: string | null
  published_at: string
}

export interface LiveVideo {
  id: string
  channel_id: string
  channel_name: string
  title: string
  thumbnail_url: string
  video_url: string
  published_at: string
  group_id: string | null
}

const LIVE_REVALIDATE_SECONDS = 300

async function loadLiveItems(): Promise<LiveFeedItem[]> {
  const sources = await getSources()
  const feedSources: Array<SourceConfig & { groupId?: string }> = []

  for (const group of sources.feeds) {
    for (const src of [...group.breaking, ...group.daily]) {
      // Posts UI is gone — only pull RSS articles for the live dashboard
      if (src.type !== 'rss') continue
      feedSources.push({ ...src, groupId: group.id })
    }
  }

  const batches = await Promise.allSettled(
    feedSources.map(async (src) => {
      const items = await fetchRss(src.name, src.url!)
      return items.map((item) => toLiveItem(item, src.groupId ?? null))
    }),
  )

  const merged: LiveFeedItem[] = []
  const seen = new Set<string>()

  for (const result of batches) {
    if (result.status !== 'fulfilled') continue
    for (const item of result.value) {
      const key = `${item.source_name}::${item.external_id}`
      if (!item.external_id || !item.url || seen.has(key)) continue
      seen.add(key)
      merged.push(item)
    }
  }

  merged.sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
  )
  return merged
}

async function loadLiveVideos(): Promise<LiveVideo[]> {
  const sources = await getSources()
  if (sources.youtube.length === 0) return []

  const batches = await Promise.allSettled(
    sources.youtube.map(async (ch) => {
      const videos = await fetchYouTubeChannel(ch.channelId, ch.name)
      return videos.map((v) => ({
        id: `${v.channelId}::${v.videoUrl}`,
        channel_id: v.channelId,
        channel_name: v.channelName,
        title: v.title,
        thumbnail_url: v.thumbnailUrl,
        video_url: v.videoUrl,
        published_at: v.publishedAt,
        group_id: ch.groupId ?? null,
      }))
    }),
  )

  const merged: LiveVideo[] = []
  const seen = new Set<string>()
  for (const result of batches) {
    if (result.status !== 'fulfilled') continue
    for (const video of result.value) {
      if (!video.video_url || seen.has(video.video_url)) continue
      seen.add(video.video_url)
      merged.push(video)
    }
  }

  merged.sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
  )
  return merged
}

function toLiveItem(item: FeedItem, groupId: string | null): LiveFeedItem {
  const externalId = item.id
  return {
    id: `${item.source}::${externalId}`,
    external_id: externalId,
    group_id: groupId,
    source_name: item.source,
    source_type: item.sourceType,
    title: item.title || '(untitled)',
    url: item.url,
    summary: item.summary || null,
    image_url: item.imageUrl,
    published_at: item.published,
  }
}

export const getLiveItems = unstable_cache(loadLiveItems, ['live-feed-items'], {
  revalidate: LIVE_REVALIDATE_SECONDS,
  tags: ['live-feed-items'],
})

export const getLiveVideos = unstable_cache(loadLiveVideos, ['live-feed-videos'], {
  revalidate: LIVE_REVALIDATE_SECONDS,
  tags: ['live-feed-videos'],
})

/** Bypass the ~5 minute cache — used by pull-to-refresh. */
export function getLiveItemsFresh() {
  return loadLiveItems()
}

/** Bypass the ~5 minute cache — used by pull-to-refresh. */
export function getLiveVideosFresh() {
  return loadLiveVideos()
}

export { LIVE_REVALIDATE_SECONDS }
