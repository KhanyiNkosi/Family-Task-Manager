// app/api/auth/register/route.ts - SECURE VERSION
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
    
    // Use server-side Supabase client with SSR cookie support
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
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name: data.user?.user_metadata?.name,
        role: data.user?.user_metadata?.role,
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
