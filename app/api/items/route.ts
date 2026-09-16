import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const groupId = searchParams.get('group_id')
  const limit = Math.min(Number(searchParams.get('limit') ?? 100) || 100, 300)

  const db = supabaseAdmin()
  let query = db
    .from('feed_items')
    .select('id, external_id, group_id, source_name, title, url, summary, published_at')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (groupId) {
    query = query.eq('group_id', groupId)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message, items: [] }, { status: 500 })
  }

  return NextResponse.json({ items: data ?? [] })
}
