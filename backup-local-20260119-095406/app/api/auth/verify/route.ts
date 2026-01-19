// app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/app/middleware/auth';

export async function GET(request: NextRequest) {
  const user = authenticateToken(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    valid: true,
    user
  });
}
