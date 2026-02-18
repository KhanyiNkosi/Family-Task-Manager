import { supabase } from "@/app/lib/supabase";
export async function fetchParentProfile(userId: string) {
  try {
    console.log('fetchParentProfile userId:', userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Supabase error', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error fetching parent profile full:', error);
    return null;
  }
}

export async function fetchParentProfileData(userId: string) {
  try {
    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('family_id')
      .eq('id', userId)
      .single();
    if (profileError || !profile) throw profileError || new Error('Profile not found');
    const familyId = profile.family_id;

    // Children count
    const { count: childrenCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('family_id', familyId)
      .eq('role', 'child');


    // Tasks assigned (all family tasks, not just created by this parent)
    const { count: totalTasksAssigned } = await supabase
      .from('tasks')
      .select('id', { count: 'exact' })
      .eq('family_id', familyId);

    // Completed tasks (ALL family tasks that are completed AND approved)
    const { count: completedTasks } = await supabase
      .from('tasks')
      .select('id', { count: 'exact' })
      .eq('family_id', familyId)
      .eq('completed', true)
      .eq('approved', true);

    // Pending tasks (all family tasks, not completed)
    const { count: pendingTasks } = await supabase
      .from('tasks')
      .select('id', { count: 'exact' })
      .eq('family_id', familyId)
      .eq('completed', false);

    // Total points (sum from reward_redemptions)
    // reward_redemptions does not have family_id, so sum for all family members
    // First, get all family member IDs
    const { data: familyMembers } = await supabase
      .from('profiles')
      .select('id')
      .eq('family_id', familyId);
    let totalPoints = 0;
    if (familyMembers && familyMembers.length > 0) {
      const familyMemberIds = familyMembers.map((m: any) => m.id);
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('reward_redemptions')
        .select('points_spent, user_id')
        .in('user_id', familyMemberIds);
      if (!rewardsError && rewardsData) {
        totalPoints = rewardsData.reduce((sum, r) => sum + (r.points_spent || 0), 0);
      }
    }

    return {
      childrenCount,
      totalTasksAssigned,
      completedTasks,
      pendingTasks,
      totalPoints
    };
  } catch (error) {
    console.error('Error fetching profile stats:', error);
    return {
      childrenCount: 0,
      totalTasksAssigned: 0,
      completedTasks: 0,
      pendingTasks: 0,
      totalPoints: 0
    };
  }
}