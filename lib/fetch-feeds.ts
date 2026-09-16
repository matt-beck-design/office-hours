import Parser from 'rss-parser'

const rssParser = new Parser({ timeout: 10000 })

export interface FeedItem {
  id: string        // guid or constructed id
  title: string
  url: string
  summary: string
  published: string // ISO string
  source: string    // source name
  sourceType: 'rss' | 'bluesky'
}

// ── RSS ──────────────────────────────────────────────────────────────────────

export async function fetchRss(name: string, url: string): Promise<FeedItem[]> {
  try {
    const feed = await rssParser.parseURL(url)
    return (feed.items ?? []).slice(0, 20).map((item) => ({
      id: item.guid ?? item.link ?? item.title ?? '',
      title: item.title ?? '',
      url: item.link ?? '',
      summary: stripHtml(item.contentSnippet ?? item.content ?? '').slice(0, 400),
      published: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
      source: name,
      sourceType: 'rss' as const,
    }))
  } catch {
    return []
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
        published: post.indexedAt ?? new Date().toISOString(),
        source: name,
        sourceType: 'bluesky' as const,
      }
    })
  } catch {
    return []
  }
}

interface BlueskyFeedEntry {
  post: {
    uri: string
    indexedAt: string
    record?: { text?: string }
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
    // Get the uploads playlist ID (same as channel ID with UC→UU)
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}
