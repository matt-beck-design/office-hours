import { NextResponse } from 'next/server'
import { runDailyDigest } from '@/lib/run-daily'

export const runtime = 'nodejs'
export const maxDuration = 60

function authGuard(req: Request) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export async function GET(req: Request) {
  const guard = authGuard(req)
  if (guard) return guard
  const result = await runDailyDigest()
  return NextResponse.json({ ok: true, ...result })
}

export async function POST(req: Request) {
  return GET(req)
}
