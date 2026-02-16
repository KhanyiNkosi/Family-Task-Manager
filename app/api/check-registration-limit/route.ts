import { createClientSupabaseClient } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * API Route: Check Registration Limit
 * 
 * Returns whether new registrations are allowed based on current user count
 * This provides a better UX than failing at database level
 */
export async function GET() {
  try {
    const supabase = createClientSupabaseClient();
    
    // Get user statistics
    const { data: stats, error } = await supabase
      .rpc('get_user_stats');
    
    if (error) {
      console.error('Error checking registration limit:', error);
      // Fail open - allow registration if we can't check
      return NextResponse.json({
        allowed: true,
        message: 'Registration check temporarily unavailable',
        stats: null
      });
    }
    
    if (!stats || stats.length === 0) {
      // No limit configured - allow registration
      return NextResponse.json({
        allowed: true,
        message: 'No registration limits configured',
        stats: null
      });
    }
    
    const userStats = stats[0];
    const allowed = userStats.limit_enabled === false || userStats.remaining_slots > 0;
    
    return NextResponse.json({
      allowed,
      message: allowed 
        ? `${userStats.remaining_slots} registration slots available`
        : 'Registration limit reached. Please check back soon or contact support@familytask.co',
      stats: {
        currentUsers: userStats.current_users,
        maxUsers: userStats.max_users,
        remainingSlots: userStats.remaining_slots,
        percentageFull: userStats.percentage_full,
        limitEnabled: userStats.limit_enabled
      }
    });
    
  } catch (error) {
    console.error('Unexpected error in check-registration-limit:', error);
    // Fail open - allow registration on error
    return NextResponse.json({
      allowed: true,
      message: 'Registration check error',
      stats: null
    }, { status: 500 });
  }
}
