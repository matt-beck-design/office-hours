import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const db = supabaseAdmin()
  const { data } = await db
    .from('digests')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)
    .single()
  if (!data) return NextResponse.json({ digest: null })
  return NextResponse.json({ digest: data })
}
