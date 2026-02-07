import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Test endpoint to debug authentication
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    console.log('All cookies:', allCookies.map(c => c.name));
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      return NextResponse.json({ 
        authenticated: false,
        error: userError.message,
        cookies: allCookies.map(c => c.name)
      }, { status: 200 });
    }
    
    if (!user) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'No user found',
        cookies: allCookies.map(c => c.name)
      }, { status: 200 });
    }
    
    return NextResponse.json({ 
      authenticated: true,
      userId: user.id,
      email: user.email,
      cookies: allCookies.map(c => c.name)
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error in auth test:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
