// app/lib/auth-helpers.ts
import { supabase } from './supabase'

export async function setUserMetadata(userId: string, metadata: { role?: string; family_code?: string; name?: string }) {
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: metadata
  })
  
  if (error) throw error
  return true
}

export async function getUserMetadata(userId: string) {
  const { data, error } = await supabase.auth.admin.getUserById(userId)
  if (error) throw error
  return data.user.user_metadata
}

// Helper to ensure all users have required metadata
export async function ensureUserMetadata(userId: string, defaults = { role: 'child', family_code: 'default' }) {
  const metadata = await getUserMetadata(userId)
  
  if (!metadata.role || !metadata.family_code) {
    await setUserMetadata(userId, {
      role: metadata.role || defaults.role,
      family_code: metadata.family_code || defaults.family_code,
      name: metadata.name || 'User'
    })
  }
}
