import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { runIngest } from '@/lib/run-ingest'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(_req: Request, { params }: { params: Promise<{ cron: string }> }) {
  const guard = await checkAdminAuth()
  if (guard) return guard
  const { cron } = await params

  if (cron === 'ingest' || cron === 'daily') {
    const result = await runIngest()
    return NextResponse.json({
      ok: true,
      message: `Ingested ${result.itemsUpserted} feed items and ${result.videosUpserted} videos across ${result.groups} groups.`,
    })
  }

  return NextResponse.json({ error: 'Unknown cron' }, { status: 400 })
}
