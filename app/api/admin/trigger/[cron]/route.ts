import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { runDailyDigest } from '@/lib/run-daily'
import { runBreakingNews } from '@/lib/run-breaking'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(_req: Request, { params }: { params: Promise<{ cron: string }> }) {
  const guard = await checkAdminAuth()
  if (guard) return guard
  const { cron } = await params

  if (cron === 'daily') {
    const result = await runDailyDigest()
    return NextResponse.json({ ok: true, message: `Digest generated for ${result.date}.` })
  }

  if (cron === 'breaking') {
    const result = await runBreakingNews()
    const message = result.fired
      ? `Breaking news fired: ${result.summary}`
      : `No breaking news (${result.reason}).`
    return NextResponse.json({ ok: true, message })
  }

  return NextResponse.json({ error: 'Unknown cron' }, { status: 400 })
}
