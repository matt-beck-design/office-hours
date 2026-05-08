import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await checkAdminAuth()
  if (guard) return guard
  const { id } = await params
  const db = supabaseAdmin()
  await db.from('youtube_channels').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
