import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const db = supabaseAdmin()
  const { data } = await db
    .from('videos')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(50)
  return NextResponse.json({ videos: data ?? [] })
}
