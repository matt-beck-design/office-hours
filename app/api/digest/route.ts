import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const db = supabaseAdmin()
  const { data } = await db
    .from('digests')
    .select('id, date, content, created_at')
    .order('date', { ascending: false })
    .limit(60)
  return NextResponse.json({ digests: data ?? [] })
}
