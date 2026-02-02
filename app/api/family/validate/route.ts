import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { familyCode } = await request.json();
    
    if (!familyCode) {
      return NextResponse.json(
        { error: 'Family code is required', valid: false },
        { status: 400 }
      );
    }

    // Check if family code exists in profiles table
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .eq('family_id', familyCode)
      .limit(1)
      .single();

    if (error || !profile) {
      return NextResponse.json({ 
        error: 'Invalid family code. Please check with your parent.',
        valid: false 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      valid: true,
      message: 'Family code verified successfully',
      parentName: profile.full_name 
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error', valid: false },
      { status: 500 }
    );
  }
}
