import { createClient } from '@supabase/supabase-js'

export function supabaseAdmin() {
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!service) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, service, {
    auth: { persistSession: false },
  })
}
