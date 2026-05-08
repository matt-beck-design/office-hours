import { supabaseAdmin } from './supabase'
import { sources as configSources } from '@/sources.config'

export interface SourceConfig {
  name: string
  type: 'rss' | 'bluesky'
  url?: string
  handle?: string
}

export interface FeedGroupConfig {
  name: string
  topic: string
  breaking: SourceConfig[]
  daily: SourceConfig[]
}

export interface SourcesConfig {
  feeds: FeedGroupConfig[]
  youtube: { name: string; channelId: string }[]
}

export async function getSources(): Promise<SourcesConfig> {
  try {
    const db = supabaseAdmin()

    const [{ data: groups }, { data: ytChannels }] = await Promise.all([
      db
        .from('feed_groups')
        .select('id, name, topic, position, feed_sources(id, name, type, url, handle, tier, enabled)')
        .order('position', { ascending: true }),
      db.from('youtube_channels').select('*').eq('enabled', true).order('created_at'),
    ])

    // Fall back to config file if no groups have been seeded yet
    if (!groups || groups.length === 0) {
      return configSources as SourcesConfig
    }

    const feeds: FeedGroupConfig[] = groups.map((g) => {
      const sources = (g.feed_sources ?? []) as Array<{
        name: string
        type: string
        url?: string
        handle?: string
        tier: string
        enabled: boolean
      }>
      return {
        name: g.name,
        topic: g.topic,
        breaking: sources
          .filter((s) => s.tier === 'breaking' && s.enabled)
          .map((s) => ({ name: s.name, type: s.type as 'rss' | 'bluesky', url: s.url, handle: s.handle })),
        daily: sources
          .filter((s) => s.tier === 'daily' && s.enabled)
          .map((s) => ({ name: s.name, type: s.type as 'rss' | 'bluesky', url: s.url, handle: s.handle })),
      }
    })

    const youtube = (ytChannels ?? []).map((c) => ({
      name: c.name,
      channelId: c.channel_id,
    }))

    return { feeds, youtube }
  } catch {
    // If DB isn't configured yet, fall back to config file
    return configSources as SourcesConfig
  }
}
