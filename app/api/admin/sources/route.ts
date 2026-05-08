import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  const guard = await checkAdminAuth()
  if (guard) return guard
  const body = await req.json()
  const { group_id, name, type, url, handle, tier } = body
  const db = supabaseAdmin()
  const { data, error } = await db
    .from('feed_sources')
    .insert({ group_id, name, type, url: url || null, handle: handle || null, tier })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ source: data })
}
