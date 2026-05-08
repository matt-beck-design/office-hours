import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await checkAdminAuth()
  if (guard) return guard
  const { id } = await params
  const body = await req.json()
  const db = supabaseAdmin()
  const { data, error } = await db
    .from('youtube_channels')
    .update({ name: body.name, channel_id: body.channel_id })
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ channel: data })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await checkAdminAuth()
  if (guard) return guard
  const { id } = await params
  const db = supabaseAdmin()
  await db.from('youtube_channels').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
