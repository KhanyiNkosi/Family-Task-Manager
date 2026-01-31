// app/lib/debug-supabase.ts
import { supabase } from './supabase'

export async function checkSupabaseConnection() {
  console.log('🔍 Checking Supabase connection...')
  
  try {
    // 1. Check if we have a session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log('Session check:', sessionError ? '❌ Error: ' + sessionError.message : '✅ OK')
    console.log('Session user:', sessionData.session?.user?.id || 'No user')
    
    // 2. Check if profiles table exists
    const { data: tablesData, error: tablesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    console.log('Profiles table check:', tablesError ? '❌ Error: ' + tablesError.message : '✅ OK')
    
    // 3. Check current user's profile
    if (sessionData.session?.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionData.session.user.id)
        .single()
      
      console.log('User profile check:', profileError ? '❌ Error: ' + profileError.message : '✅ OK')
      console.log('Current profile:', profileData)
    }
    
    return { sessionData, tablesError, profileError: sessionData.session?.user ? profileError : null }
    
  } catch (error) {
    console.error('Debug error:', error)
    return { error }
  }
}
