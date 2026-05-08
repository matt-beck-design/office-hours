import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const COOKIE = 'oh_admin'

export async function checkAdminAuth(): Promise<NextResponse | null> {
  const store = await cookies()
  const token = store.get(COOKIE)?.value
  const secret = process.env.ADMIN_SECRET
  if (!secret) return NextResponse.json({ error: 'ADMIN_SECRET not set' }, { status: 500 })
  if (token !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return null
}

export async function setAdminCookie(res: NextResponse) {
  res.cookies.set(COOKIE, process.env.ADMIN_SECRET!, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
}

export async function clearAdminCookie(res: NextResponse) {
  res.cookies.delete(COOKIE)
}

export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies()
  const token = store.get(COOKIE)?.value
  return token === process.env.ADMIN_SECRET && !!process.env.ADMIN_SECRET
}
