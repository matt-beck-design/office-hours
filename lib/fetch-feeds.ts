import Parser from 'rss-parser'

const rssParser = new Parser({ timeout: 10000 })

export interface FeedItem {
  id: string        // guid or constructed id
  title: string
  url: string
  summary: string
  published: string // ISO string
  source: string    // source name
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
  // YouTube RSS feed — no API key required
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
  try {
    const feed = await rssParser.parseURL(url)
    return (feed.items ?? []).slice(0, 10).map((item) => ({
      channelId,
      channelName,
      title: item.title ?? '',
      thumbnailUrl: extractYtThumbnail(item.link ?? ''),
      videoUrl: item.link ?? '',
      publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
    }))
  } catch {
    return []
  }
}

function extractYtThumbnail(videoUrl: string): string {
  const match = videoUrl.match(/[?&]v=([^&]+)/)
  if (!match) return ''
  return `https://i.ytimg.com/vi/${match[1]}/mqdefault.jpg`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}
