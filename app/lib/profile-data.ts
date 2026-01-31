// app/lib/profile-data.ts
import { supabase } from './supabase'

export interface ProfileStats {
  childrenCount: number
  totalTasksAssigned: number
  completedTasks: number
  pendingTasks: number
  totalPoints: number
}

export async function fetchParentProfileData(userId: string): Promise<ProfileStats> {
  try {
    // Get user's family
    const { data: familyData, error: familyError } = await supabase
      .rpc('get_user_family')
    
    if (familyError) throw familyError
    
    const familyId = familyData
    
    // Get children count
    const { data: childrenData, error: childrenError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('family_id', familyId)
      .eq('role', 'child')
    
    if (childrenError) throw childrenError
    const childrenCount = childrenData?.length || 0
    
    // Get tasks statistics
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('status')
      .eq('family_id', familyId)
    
    if (tasksError) throw tasksError
    
    const totalTasksAssigned = tasksData?.length || 0
    const completedTasks = tasksData?.filter(task => 
      task.status === 'completed' || task.status === 'approved'
    ).length || 0
    const pendingTasks = tasksData?.filter(task => 
      task.status === 'pending' || task.status === 'in_progress'
    ).length || 0
    
    // Get total points (from claimed rewards or task completions)
    const { data: rewardsData, error: rewardsError } = await supabase
      .from('claimed_rewards')
      .select('points_used')
      .eq('family_id', familyId)
    
    let totalPoints = 0
    if (!rewardsError && rewardsData) {
      totalPoints = rewardsData.reduce((sum, reward) => sum + (reward.points_used || 0), 0)
    }
    
    return {
      childrenCount,
      totalTasksAssigned,
      completedTasks,
      pendingTasks,
      totalPoints
    }
    
  } catch (error) {
    console.error('Error fetching profile data:', error)
    // Return default values on error
    return {
      childrenCount: 0,
      totalTasksAssigned: 0,
      completedTasks: 0,
      pendingTasks: 0,
      totalPoints: 0
    }
  }
}

export async function fetchParentProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    
    return data
  } catch (error) {
    console.error('Error fetching parent profile:', error)
    return null
  }
}
