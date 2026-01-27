// app/middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'familytask-secret-key-2026-change-in-production';

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

export function authenticateToken(request: NextRequest): AuthUser | null {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return null;
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as AuthUser;
    return user;
  } catch (error) {
    return null;
  }
}

export function authMiddleware(handler: Function) {
  return async (request: NextRequest) => {
    const user = authenticateToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Add user info to request object
    (request as any).user = user;
    
    return handler(request);
  };
}
