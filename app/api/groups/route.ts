import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const db = supabaseAdmin()
  const { data } = await db
    .from('feed_groups')
    .select('id, name')
    .order('position', { ascending: true })
  return NextResponse.json({ groups: data ?? [] }, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  })
}
