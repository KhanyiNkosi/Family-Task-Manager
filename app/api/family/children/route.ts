import { NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';

// Create admin client for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseAuthClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get parent's family_id
    const { data: parentProfile, error: parentError } = await supabaseAdmin
      .from('profiles')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (parentError || !parentProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get all children in the family
    const { data: children, error: childrenError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        created_at
      `)
      .eq('family_id', parentProfile.family_id)
      .neq('id', user.id);

    if (childrenError) {
      return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 });
    }

    // Get user_profiles to get role and points for each child
    const childIds = children?.map(c => c.id) || [];
    const { data: userProfiles } = await supabaseAdmin
      .from('user_profiles')
      .select('id, role, total_points')
      .in('id', childIds)
      .eq('role', 'child');

    // Combine the data
    const childrenWithDetails = children?.map(child => {
      const profile = userProfiles?.find(p => p.id === child.id);
      return {
        id: child.id,
        name: child.full_name,
        email: child.email,
        points: profile?.total_points || 0,
        joinedAt: child.created_at
      };
    }).filter(c => c.points !== undefined); // Only include actual children

    return NextResponse.json({ 
      children: childrenWithDetails || [],
      familyId: parentProfile.family_id
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
