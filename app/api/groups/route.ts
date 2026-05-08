import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const db = supabaseAdmin()
  const { data } = await db
    .from('feed_groups')
    .select('id, name')
    .order('position', { ascending: true })
  return NextResponse.json({ groups: data ?? [] })
}
