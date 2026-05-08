import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { sources } from '@/sources.config'

export async function POST() {
  const guard = await checkAdminAuth()
  if (guard) return guard

  const db = supabaseAdmin()

  // Clear existing data
  await db.from('feed_groups').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await db.from('youtube_channels').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // Insert groups and sources
  for (let i = 0; i < sources.feeds.length; i++) {
    const group = sources.feeds[i]
    const { data: groupRow, error } = await db
      .from('feed_groups')
      .insert({ name: group.name, topic: group.topic, position: i })
      .select()
      .single()
    if (error || !groupRow) continue

    const sourcesToInsert = [
      ...group.breaking.map((s) => ({
        group_id: groupRow.id,
        name: s.name,
        type: s.type,
        url: s.type === 'rss' ? (s as { url: string }).url : null,
        handle: s.type === 'bluesky' ? (s as { handle: string }).handle : null,
        tier: 'breaking' as const,
      })),
      ...group.daily.map((s) => ({
        group_id: groupRow.id,
        name: s.name,
        type: s.type,
        url: s.type === 'rss' ? (s as { url: string }).url : null,
        handle: s.type === 'bluesky' ? (s as { handle: string }).handle : null,
        tier: 'daily' as const,
      })),
    ]
    if (sourcesToInsert.length > 0) {
      await db.from('feed_sources').insert(sourcesToInsert)
    }
  }

  // Insert YouTube channels
  const ytSources = sources.youtube as Array<{ name: string; channelId: string }>
  if (ytSources.length > 0) {
    await db
      .from('youtube_channels')
      .insert(ytSources.map((c) => ({ name: c.name, channel_id: c.channelId })))
  }

  return NextResponse.json({
    ok: true,
    message: `Imported ${sources.feeds.length} feed group(s) and ${ytSources.length} YouTube channel(s).`,
  })
}
