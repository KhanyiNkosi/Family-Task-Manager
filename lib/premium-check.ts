import { createClientSupabaseClient } from '@/lib/supabaseClient';

/**
 * Check if the current user has premium access
 * @returns Promise<boolean> - true if user has active premium or lifetime access
 */
export async function checkPremiumAccess(): Promise<boolean> {
  try {
    const supabase = createClientSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;
    
    const { data, error } = await supabase.rpc('is_premium_user', {
      p_user_id: user.id
    });
    
    if (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error('Error in checkPremiumAccess:', error);
    return false;
  }
}

/**
 * Get detailed subscription information for the current user
 */
export async function getUserSubscription() {
  try {
    const supabase = createClientSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    const { data, error } = await supabase.rpc('get_user_subscription', {
      p_user_id: user.id
    });
    
    if (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
    
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error in getUserSubscription:', error);
    return null;
  }
}

/**
 * Get premium status from profile (client-side)
 */
export async function getPremiumStatus() {
  try {
    const supabase = createClientSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { isPremium: false, status: 'free', expiresAt: null };
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('premium_status, premium_expires_at')
      .eq('id', user.id)
      .single();
    
    if (error || !profile) {
      return { isPremium: false, status: 'free', expiresAt: null };
    }
    
    const isPremium = profile.premium_status === 'premium' || profile.premium_status === 'lifetime';
    const hasExpired = profile.premium_expires_at && new Date(profile.premium_expires_at) < new Date();
    
    return {
      isPremium: isPremium && !hasExpired,
      status: profile.premium_status,
      expiresAt: profile.premium_expires_at
    };
  } catch (error) {
    console.error('Error in getPremiumStatus:', error);
    return { isPremium: false, status: 'free', expiresAt: null };
  }
}
