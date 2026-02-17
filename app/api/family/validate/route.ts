import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { familyCode, role, checkParentLimit } = await request.json();
    
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

    // If a parent is trying to join, check parent count limit (max 2 parents)
    if (checkParentLimit && role === 'parent') {
      const { count: parentCount, error: countError } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', familyCode)
        .eq('role', 'parent');

      if (countError) {
        console.error('Error checking parent count:', countError);
        return NextResponse.json({ 
          error: 'Failed to validate family capacity',
          valid: false 
        }, { status: 500 });
      }

      if (parentCount && parentCount >= 2) {
        return NextResponse.json({ 
          error: 'This family already has 2 parents. Maximum limit reached.',
          valid: false 
        }, { status: 400 });
      }
    }

    return NextResponse.json({ 
      valid: true,
      message: 'Family code verified successfully',
      parentName: profile.full_name 
    });
  } catch (err) {
    console.error('Validation error:', err);
    return NextResponse.json(
      { error: 'Internal server error', valid: false },
      { status: 500 }
    );
  }
}
