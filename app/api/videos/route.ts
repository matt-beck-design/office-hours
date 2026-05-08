import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const db = supabaseAdmin()
  const { data } = await db
    .from('videos')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(200)
  return NextResponse.json({ videos: data ?? [] }, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  })
}
