import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const guard = await checkAdminAuth()
  if (guard) return guard
  const db = supabaseAdmin()
  const { data } = await db.from('youtube_channels').select('*').order('created_at')
  return NextResponse.json({ channels: data ?? [] })
}

export async function POST(req: Request) {
  const guard = await checkAdminAuth()
  if (guard) return guard
  const { name, channel_id, group_id } = await req.json()
  const db = supabaseAdmin()
  const { data, error } = await db
    .from('youtube_channels')
    .insert({ name, channel_id, group_id: group_id || null })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ channel: data })
}
