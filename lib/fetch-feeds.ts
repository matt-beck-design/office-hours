import Parser from 'rss-parser'

type RssItem = {
  guid?: string
  link?: string
  title?: string
  contentSnippet?: string
  content?: string
  'content:encoded'?: string
  isoDate?: string
  pubDate?: string
  enclosure?: { url?: string; type?: string }
  mediaContent?: Array<{ $?: { url?: string; type?: string; medium?: string } }>
  mediaThumbnail?: Array<{ $?: { url?: string } }>
}

const rssParser = new Parser({
  timeout: 10000,
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
      ['content:encoded', 'content:encoded'],
    ],
  },
})

export interface FeedItem {
  id: string
  title: string
  url: string
  summary: string
  imageUrl: string | null
  published: string
  source: string
  sourceType: 'rss' | 'bluesky'
}

// ── RSS ──────────────────────────────────────────────────────────────────────

export async function fetchRss(name: string, url: string): Promise<FeedItem[]> {
  try {
    const feed = await rssParser.parseURL(url)
    return (feed.items ?? []).slice(0, 20).map((raw) => {
      const item = raw as RssItem
      return {
        id: item.guid ?? item.link ?? item.title ?? '',
        title: item.title ?? '',
        url: item.link ?? '',
        summary: stripHtml(item.contentSnippet ?? item.content ?? '').slice(0, 400),
        imageUrl: extractRssImage(item),
        published: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
        source: name,
        sourceType: 'rss' as const,
      }
    })
  } catch {
    return []
  }
}

function extractRssImage(item: RssItem): string | null {
  const enclosure = item.enclosure
  if (enclosure?.url && isImageUrl(enclosure.url, enclosure.type)) {
    return absoluteUrl(enclosure.url)
  }

  for (const media of item.mediaContent ?? []) {
    const url = media.$?.url
    if (url && isImageUrl(url, media.$?.type) && media.$?.medium !== 'video') {
      return absoluteUrl(url)
    }
  }

  for (const thumb of item.mediaThumbnail ?? []) {
    if (thumb.$?.url) return absoluteUrl(thumb.$.url)
  }

  const html = item['content:encoded'] ?? item.content ?? ''
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (match?.[1]) return absoluteUrl(match[1])

  return null
}

function isImageUrl(url: string, type?: string): boolean {
  if (type?.startsWith('image/')) return true
  return /\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(url)
}

function absoluteUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed.toString()
  } catch {
    return null
  }
}

// ── Bluesky ──────────────────────────────────────────────────────────────────

const BSKY_API = 'https://public.api.bsky.app/xrpc'

export async function fetchBluesky(name: string, handle: string): Promise<FeedItem[]> {
  try {
    const res = await fetch(
      `${BSKY_API}/app.bsky.feed.getAuthorFeed?actor=${handle}&limit=20&filter=posts_no_replies`,
      { next: { revalidate: 0 } },
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.feed ?? []).map((entry: BlueskyFeedEntry) => {
      const post = entry.post
      const text = post.record?.text ?? ''
      return {
        id: post.uri,
        title: text.slice(0, 100),
        url: bskyPostUrl(handle, post.uri),
        summary: text.slice(0, 400),
        imageUrl: extractBlueskyImage(post),
        published: post.indexedAt ?? new Date().toISOString(),
        source: name,
        sourceType: 'bluesky' as const,
      }
    })
  } catch {
    return []
  }
}

function extractBlueskyImage(post: BlueskyFeedEntry['post']): string | null {
  const images = post.embed?.images
  if (images?.[0]?.fullsize) return images[0].fullsize
  if (images?.[0]?.thumb) return images[0].thumb

  const external = post.embed?.external?.thumb
  if (external) return external

  const nested = post.embed?.media?.images
  if (nested?.[0]?.fullsize) return nested[0].fullsize
  if (nested?.[0]?.thumb) return nested[0].thumb

  return null
}

interface BlueskyFeedEntry {
  post: {
    uri: string
    indexedAt: string
    record?: { text?: string }
    embed?: {
      images?: Array<{ thumb?: string; fullsize?: string }>
      external?: { thumb?: string }
      media?: { images?: Array<{ thumb?: string; fullsize?: string }> }
    }
  }
}

function bskyPostUrl(handle: string, uri: string): string {
  const rkey = uri.split('/').pop()
  return `https://bsky.app/profile/${handle}/post/${rkey}`
}

// ── YouTube ───────────────────────────────────────────────────────────────────

export interface VideoItem {
  channelId: string
  channelName: string
  title: string
  thumbnailUrl: string
  videoUrl: string
  publishedAt: string
}

export async function fetchYouTubeChannel(
  channelId: string,
  channelName: string,
): Promise<VideoItem[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return []

  try {
    const uploadsPlaylistId = 'UU' + channelId.slice(2)
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=10&playlistId=${uploadsPlaylistId}&key=${apiKey}`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()

    return (data.items ?? []).map((item: YouTubeApiItem) => {
      const snippet = item.snippet
      const videoId = snippet.resourceId?.videoId ?? ''
      return {
        channelId,
        channelName,
        title: snippet.title ?? '',
        thumbnailUrl: snippet.thumbnails?.medium?.url ?? snippet.thumbnails?.default?.url ?? '',
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        publishedAt: snippet.publishedAt ?? new Date().toISOString(),
      }
    })
  } catch {
    return []
  }
}

interface YouTubeApiItem {
  snippet: {
    title: string
    publishedAt: string
    resourceId?: { videoId: string }
    thumbnails?: {
      default?: { url: string }
      medium?: { url: string }
    }
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}
