import { NextResponse } from 'next/server'
import { runBreakingNews } from '@/lib/run-breaking'

export const runtime = 'nodejs'
export const maxDuration = 30

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
  const result = await runBreakingNews()
  return NextResponse.json({ ok: true, ...result })
}

export async function POST(req: Request) {
  return GET(req)
}
