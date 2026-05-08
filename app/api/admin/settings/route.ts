import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: Request) {
  const guard = await checkAdminAuth()
  if (guard) return guard
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')
  const db = supabaseAdmin()
  if (key) {
    const { data } = await db.from('settings').select('value').eq('key', key).single()
    return NextResponse.json({ value: data?.value ?? null })
  }
  const { data } = await db.from('settings').select('key, value')
  return NextResponse.json({ settings: data ?? [] })
}

export async function PUT(req: Request) {
  const guard = await checkAdminAuth()
  if (guard) return guard
  const { key, value } = await req.json()
  const db = supabaseAdmin()
  const { error } = await db
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
