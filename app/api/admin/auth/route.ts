import { NextResponse } from 'next/server'
import { isAdminAuthed, setAdminCookie, clearAdminCookie } from '@/lib/admin-auth'

// GET — check auth status (used by the admin page on mount)
export async function GET() {
  const authed = await isAdminAuthed()
  return NextResponse.json({ authenticated: authed })
}

// POST — login
export async function POST(req: Request) {
  const { password } = await req.json()
  const secret = process.env.ADMIN_SECRET
  if (!secret) return NextResponse.json({ error: 'ADMIN_SECRET not set' }, { status: 500 })
  if (password !== secret) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  await setAdminCookie(res)
  return res
}

// DELETE — logout
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  await clearAdminCookie(res)
  return res
}
