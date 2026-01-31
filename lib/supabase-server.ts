// lib/supabase-server.ts - For server-side/API routes
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
if (!supabaseServiceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

// Server client with service role (has admin privileges)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Admin auth helper
export async function createUserAdmin(email: string, password: string, metadata: any) {
  const { data, error } = await supabaseServer.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email
    user_metadata: metadata,
  })
  
  return { data, error }
}
