// app/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

// Helper function to get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Helper function to get user role
export async function getUserRole() {
  const user = await getCurrentUser()
  return user?.user_metadata?.role || 'child'
}

// Helper function to get family ID
export async function getFamilyId() {
  const user = await getCurrentUser()
  return user?.user_metadata?.family_code || null
}

// Tasks functions
export const tasksApi = {
  // Get tasks for current user
  async getTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Create a new task (parent only)
  async createTask(task: { title: string; description?: string; points: number; assigned_to?: string }) {
    const familyId = await getFamilyId()
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ ...task, family_id: familyId }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update task (parent only)
  async updateTask(id: string, updates: Partial<{ completed: boolean; title: string; points: number }>) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete task (parent only)
  async deleteTask(id: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  }
}

// Rewards functions
export const rewardsApi = {
  // Get available rewards for current family
  async getRewards() {
    const familyId = await getFamilyId()
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('family_id', familyId)
      .eq('is_active', true)
      .order('points_required', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // Claim a reward (child only)
  async claimReward(rewardId: string) {
    const user = await getCurrentUser()
    const { data, error } = await supabase
      .from('claimed_rewards')
      .insert([{ reward_id: rewardId, user_id: user?.id }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get claimed rewards for current user
  async getClaimedRewards() {
    const user = await getCurrentUser()
    const { data, error } = await supabase
      .from('claimed_rewards')
      .select(`
        *,
        rewards (*)
      `)
      .eq('user_id', user?.id)
      .order('claimed_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }
}

// User profile functions
export const profileApi = {
  // Get user profile
  async getProfile() {
    const user = await getCurrentUser()
    if (!user) return null
    
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      role: user.user_metadata?.role || 'child',
      family_code: user.user_metadata?.family_code || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      created_at: user.created_at
    }
  },

  // Update user profile
  async updateProfile(updates: { name?: string; avatar_url?: string }) {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    })
    
    if (error) throw error
    return data.user
  }
}
