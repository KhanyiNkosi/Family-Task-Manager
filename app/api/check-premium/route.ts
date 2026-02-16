import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// This API route checks if a user has an active premium subscription
export async function GET(req: NextRequest) {
  try {
    // Get user ID from query params or auth header
    const userId = req.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required', isPremium: false },
        { status: 400 }
      );
    }

    // Create Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check user's subscription status
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_renews_at, license_key')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: 'Profile not found', isPremium: false },
        { status: 404 }
      );
    }

    // Check if subscription is active and not expired
    const isPremium = profile.subscription_status === 'active' && 
                     (!profile.subscription_renews_at || new Date(profile.subscription_renews_at) > new Date());

    return NextResponse.json({
      isPremium,
      subscriptionStatus: profile.subscription_status,
      renewsAt: profile.subscription_renews_at,
      hasLicenseKey: !!profile.license_key
    });
  } catch (error) {
    console.error('License validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', isPremium: false },
      { status: 500 }
    );
  }
}
