import { NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const { email, password, name, role, familyCode } = await request.json();
    
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }
    
    // Use server SSR auth client so cookies/sessions are handled correctly
    const supabase = createServerSupabaseAuthClient();
    const redirectTo = `${new URL(request.url).origin}/auth/callback`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: role || 'child',
          family_code: familyCode || '',
        },
        emailRedirectTo: redirectTo,
      },
    });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({
      user: {
        id: data.user?.id,
        email: data.user?.email,
      }
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
