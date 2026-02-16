// app/api/family/link-child/route.ts
// Links child user to existing family
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const { userId, familyCode } = await request.json();
    
    if (!userId || !familyCode) {
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
    
    console.log(`[Link Child] Linking user ${userId} to family ${familyCode}`);
    
    // Verify family exists
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('id')
      .eq('id', familyCode)
      .single();
    
    if (familyError || !family) {
      console.error('[Link Child] Family not found:', familyError);
      return NextResponse.json(
        { success: false, error: 'Invalid family code' },
        { status: 404 }
      );
    }
    
    // Update child's profile with family_id
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ family_id: familyCode })
      .eq('id', userId);
    
    if (profileError) {
      console.error('[Link Child] Profile update error:', profileError);
      return NextResponse.json(
        { success: false, error: `Profile update failed: ${profileError.message}` },
        { status: 500 }
      );
    }
    
    console.log(`[Link Child] ✅ Child linked to family`);
    
    return NextResponse.json({ 
      success: true, 
      familyId: familyCode,
      message: 'Child linked successfully' 
    });
    
  } catch (error: any) {
    console.error('[Link Child] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
