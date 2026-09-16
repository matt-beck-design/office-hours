import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { isReleaseKind } from '@/lib/releases'

export async function GET() {
  const db = supabaseAdmin()
  const { data, error } = await db
    .from('releases')
    .select('id, title, kind, release_date, url, notes, created_at')
    .order('release_date', { ascending: true })
    .limit(500)

  if (error) {
    return NextResponse.json({ error: error.message, releases: [] }, { status: 500 })
  }

  return NextResponse.json({ releases: data ?? [] })
}

export async function POST(req: Request) {
  const guard = await checkAdminAuth()
  if (guard) return guard

  const body = await req.json()
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const kind = body.kind
  const releaseDate = typeof body.release_date === 'string' ? body.release_date : ''
  const url = typeof body.url === 'string' && body.url.trim() ? body.url.trim() : null
  const notes = typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : null

  if (!title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
  if (!isReleaseKind(kind)) return NextResponse.json({ error: 'Invalid kind.' }, { status: 400 })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)) {
    return NextResponse.json({ error: 'A valid release date is required.' }, { status: 400 })
  }

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('releases')
    .insert({
      title,
      kind,
      release_date: releaseDate,
      url,
      notes,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ release: data })
}
