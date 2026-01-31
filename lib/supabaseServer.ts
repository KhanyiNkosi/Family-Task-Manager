// lib/supabaseServer.ts - For @supabase/ssr (Next.js 13/14)
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// For admin pages using service role key (no cookies needed)
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!supabaseKey) {
    throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
  }

  // For service role key, we don't need cookies
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No-op for service role
        },
      },
    }
  );
}

// For regular pages that need auth cookies
export function createServerSupabaseAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookies().getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookies().set(name, value, options)
            );
          } catch {
            // Ignore cookie errors in server actions
          }
        },
      },
    }
  );
}
