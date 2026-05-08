import { createClient } from '@supabase/supabase-js'

// Browser-safe client (anon key) — lazy to avoid init errors during build
let _client: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return _client
}

// Alias kept for convenience in server components / API routes that already import this
export const supabase = {
  get from() {
    return getSupabase().from.bind(getSupabase())
  },
}

// Server-only client with elevated privileges (used in API routes / crons)
export function supabaseAdmin() {
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!service) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, service, {
    auth: { persistSession: false },
  })
}
