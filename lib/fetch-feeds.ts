import Parser from 'rss-parser'

type AttrMap = Record<string, string | undefined>

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
  mediaContent?: unknown
  mediaThumbnail?: unknown
  mediaGroup?: unknown
}

const rssParser = new Parser({
  timeout: 10000,
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
      ['media:group', 'mediaGroup', { keepArray: true }],
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
  if (enclosure?.url && isLikelyImage(enclosure.url, enclosure.type)) {
    return absoluteUrl(enclosure.url)
  }

  for (const node of asArray(item.mediaThumbnail)) {
    const url = attr(node, 'url')
    if (url) return absoluteUrl(url)
  }

  for (const node of asArray(item.mediaContent)) {
    const url = attr(node, 'url')
    const medium = attr(node, 'medium')
    const type = attr(node, 'type')
    if (url && medium !== 'video' && isLikelyImage(url, type, medium)) {
      return absoluteUrl(url)
    }
  }

  for (const group of asArray(item.mediaGroup)) {
    if (!group || typeof group !== 'object') continue
    const g = group as Record<string, unknown>
    for (const node of asArray(g['media:thumbnail'] ?? g.mediaThumbnail)) {
      const url = attr(node, 'url')
      if (url) return absoluteUrl(url)
    }
    for (const node of asArray(g['media:content'] ?? g.mediaContent)) {
      const url = attr(node, 'url')
      const medium = attr(node, 'medium')
      const type = attr(node, 'type')
      if (url && medium !== 'video' && isLikelyImage(url, type, medium)) {
        return absoluteUrl(url)
      }
    }
  }

  const html = item['content:encoded'] ?? item.content ?? ''
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (match?.[1]) return absoluteUrl(decodeXml(match[1]))

  return null
}

function asArray(value: unknown): unknown[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

function attr(node: unknown, key: string): string | undefined {
  if (!node) return undefined
  if (typeof node === 'string') return key === 'url' ? node : undefined
  if (typeof node !== 'object') return undefined
  const obj = node as { $?: AttrMap } & AttrMap
  return obj.$?.[key] ?? obj[key]
}

function isLikelyImage(url: string, type?: string, medium?: string): boolean {
  if (medium === 'image') return true
  if (type?.startsWith('image/')) return true
  if (/\.(jpe?g|png|gif|webp|avif)(\?|#|$)/i.test(url)) return true
  // CDN paths often omit extensions (BBC ichef, etc.)
  if (/\/(image|images|img|photos?|media|thumb|thumbnail|cpsprodpb)\b/i.test(url)) return true
  return false
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&#038;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function absoluteUrl(url: string): string | null {
  try {
    const parsed = new URL(decodeXml(url.trim()))
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed.toString()
  } catch {
    return null
  }
}

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
