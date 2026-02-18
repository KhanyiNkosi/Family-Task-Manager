// app/api/family/create/route.ts
// Creates family and updates profile for new parent users
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const { userId, familyId, role } = await request.json();
    
    if (!userId || !familyId || role !== 'parent') {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters' },
        { status: 400 }
      );
    }
    
    // Use service role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log(`[Family Create] Creating family ${familyId} for user ${userId}`);
    
    // Step 1: Create family record
    const { error: familyError } = await supabase
      .from('families')
      .insert({
        id: familyId,
        owner_id: userId,
        created_at: new Date().toISOString()
      });
    
    if (familyError) {
      console.error('[Family Create] Family insert error:', familyError);
      return NextResponse.json(
        { success: false, error: `Family creation failed: ${familyError.message}` },
        { status: 500 }
      );
    }
    
    console.log(`[Family Create] ✅ Family created: ${familyId}`);
    
    // Step 2: Update profile with family_id
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ family_id: familyId })
      .eq('id', userId);
    
    if (profileError) {
      console.error('[Family Create] Profile update error:', profileError);
      return NextResponse.json(
        { success: false, error: `Profile update failed: ${profileError.message}` },
        { status: 500 }
      );
    }
    
    console.log(`[Family Create] ✅ Profile updated with family_id`);
    
    // Step 3: Create default rewards for the new family
    const defaultRewards = [
      {
        title: '🍦 Ice Cream Treat',
        description: 'Enjoy a delicious ice cream treat!',
        points_cost: 20,
        family_id: familyId,
        created_by: userId,
        is_active: true,
        is_default: true
      },
      {
        title: '📱 30 Mins Screen Time',
        description: 'Extra 30 minutes of screen time for your favorite activity!',
        points_cost: 30,
        family_id: familyId,
        created_by: userId,
        is_active: true,
        is_default: true
      },
      {
        title: '🎮 1 Hour Video Games',
        description: 'One full hour to play your favorite video games!',
        points_cost: 50,
        family_id: familyId,
        created_by: userId,
        is_active: true,
        is_default: true
      }
    ];
    
    const { error: rewardsError } = await supabase
      .from('rewards')
      .insert(defaultRewards);
    
    if (rewardsError) {
      console.error('[Family Create] Default rewards creation failed:', rewardsError);
      // Don't fail the whole request - family is already created
      // Just log the error and continue
    } else {
      console.log(`[Family Create] ✅ Created 3 default rewards`);
    }
    
    return NextResponse.json({ 
      success: true, 
      familyId,
      message: 'Family created successfully' 
    });
    
  } catch (error: any) {
    console.error('[Family Create] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
