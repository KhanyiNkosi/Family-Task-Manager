// app/api/family/link-parent/route.ts
// Links a second parent to an existing family
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const { userId, familyCode } = await request.json();
    
    if (!userId || !familyCode) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or familyCode' },
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
    
    console.log(`[Link Parent] Linking parent ${userId} to family ${familyCode}`);
    
    // First verify the family exists
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('id')
      .eq('id', familyCode)
      .single();
    
    if (familyError || !family) {
      console.error('[Link Parent] Family not found:', familyError);
      return NextResponse.json(
        { success: false, error: 'Family not found' },
        { status: 404 }
      );
    }

    // Check current parent count (should be 1, max is 2)
    const { count: parentCount, error: countError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('family_id', familyCode)
      .eq('role', 'parent');

    if (countError) {
      console.error('[Link Parent] Error checking parent count:', countError);
      return NextResponse.json(
        { success: false, error: 'Failed to verify family capacity' },
        { status: 500 }
      );
    }

    if (parentCount && parentCount >= 2) {
      return NextResponse.json(
        { success: false, error: 'Family already has maximum of 2 parents' },
        { status: 400 }
      );
    }

    // Update the parent's profile to link to this family
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ family_id: familyCode })
      .eq('id', userId);
    
    if (profileError) {
      console.error('[Link Parent] Profile update error:', profileError);
      return NextResponse.json(
        { success: false, error: `Profile update failed: ${profileError.message}` },
        { status: 500 }
      );
    }
    
    console.log(`[Link Parent] ✅ Parent linked to family successfully`);
    
    return NextResponse.json({ 
      success: true, 
      familyId: familyCode,
      message: 'Parent linked to family successfully' 
    });
    
  } catch (error: any) {
    console.error('[Link Parent] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
