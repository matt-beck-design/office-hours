import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  const body = await req.json()
  const { endpoint, keys } = body
  if (!endpoint || !keys) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }
  const db = supabaseAdmin()
  await db
    .from('push_subscriptions')
    .upsert({ endpoint, keys }, { onConflict: 'endpoint' })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const { endpoint } = await req.json()
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })
  const db = supabaseAdmin()
  await db.from('push_subscriptions').delete().eq('endpoint', endpoint)
  return NextResponse.json({ ok: true })
}
