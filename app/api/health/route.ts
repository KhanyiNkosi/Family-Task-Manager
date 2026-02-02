import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check - verify env vars are set
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const isHealthy = hasSupabaseUrl && hasSupabaseKey;
    
    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        supabaseUrl: hasSupabaseUrl ? 'ok' : 'missing',
        supabaseKey: hasSupabaseKey ? 'ok' : 'missing',
      },
    }, { status: isHealthy ? 200 : 503 });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    }, { status: 503 });
  }
}
