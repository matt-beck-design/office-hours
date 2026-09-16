import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { isReleaseKind } from '@/lib/releases'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await checkAdminAuth()
  if (guard) return guard

  const { id } = await params
  const body = await req.json()
  const patch: Record<string, string | null> = {}

  if (typeof body.title === 'string') {
    const title = body.title.trim()
    if (!title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
    patch.title = title
  }
  if (body.kind !== undefined) {
    if (!isReleaseKind(body.kind)) return NextResponse.json({ error: 'Invalid kind.' }, { status: 400 })
    patch.kind = body.kind
  }
  if (body.release_date !== undefined) {
    if (typeof body.release_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.release_date)) {
      return NextResponse.json({ error: 'A valid release date is required.' }, { status: 400 })
    }
    patch.release_date = body.release_date
  }
  if (body.url !== undefined) {
    patch.url = typeof body.url === 'string' && body.url.trim() ? body.url.trim() : null
  }
  if (body.notes !== undefined) {
    patch.notes = typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : null
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })
  }

  const db = supabaseAdmin()
  const { data, error } = await db.from('releases').update(patch).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ release: data })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await checkAdminAuth()
  if (guard) return guard

  const { id } = await params
  const db = supabaseAdmin()
  const { error } = await db.from('releases').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
