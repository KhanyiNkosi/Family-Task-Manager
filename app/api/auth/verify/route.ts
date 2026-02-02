// app/api/auth/verify/route.ts - Dynamic environment handling
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const nextParam = url.searchParams.get('next') || '/';

  if (!token_hash || !type) {
    return NextResponse.json(
      { error: 'Missing token_hash or type' },
      { status: 400 }
    );
  }

  // Dynamic APP_URL detection
  const getAppUrl = () => {
    // 1. Check environment variable first
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }
    
    // 2. Check Vercel environment variables
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    
    if (process.env.VERCEL_BRANCH_URL) {
      return `https://${process.env.VERCEL_BRANCH_URL}`;
    }
    
    // 3. Default to localhost for development
    return 'http://localhost:3000';
  };

  const baseUrl = getAppUrl();
  console.log('Auth redirect using base URL:', baseUrl);

  // Create Supabase client
  const cookieStore = cookies();
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
          } catch {
            // Ignore cookie errors
          }
        },
      },
    }
  );

  const { error } = await supabase.auth.verifyOtp({
    type: type as 'email' | 'recovery',
    token_hash,
  });

  if (error) {
    const errorUrl = new URL('/auth/error', baseUrl);
    errorUrl.searchParams.set('reason', error.message);
    return NextResponse.redirect(errorUrl.toString(), { status: 303 });
  }

  const redirectUrl = new URL(nextParam, baseUrl);
  return NextResponse.redirect(redirectUrl.toString(), { status: 303 });
}
