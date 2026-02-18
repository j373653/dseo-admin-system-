import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Cliente para operaciones de autenticación (client-side)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Cliente admin para operaciones server-side (service role) - lazy initialization
let _supabaseAdmin: ReturnType<typeof createClient> | null = null

export const getSupabaseAdmin = () => {
  if (!_supabaseAdmin) {
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_KEY is required for admin operations')
    }
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return _supabaseAdmin
}
