import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const guard = await checkAdminAuth()
  if (guard) return guard
  const db = supabaseAdmin()
  const { data: groups } = await db
    .from('feed_groups')
    .select('*, feed_sources(*)')
    .order('position', { ascending: true })
  return NextResponse.json({ groups: groups ?? [] })
}

export async function POST(req: Request) {
  const guard = await checkAdminAuth()
  if (guard) return guard
  const { name, topic } = await req.json()
  const db = supabaseAdmin()
  const { data: existing } = await db.from('feed_groups').select('position').order('position', { ascending: false }).limit(1)
  const position = existing && existing.length > 0 ? (existing[0].position ?? 0) + 1 : 0
  const { data, error } = await db.from('feed_groups').insert({ name, topic, position }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ group: data })
}
