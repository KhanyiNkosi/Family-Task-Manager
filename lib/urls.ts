// lib/urls.ts - Utility for handling environment-specific URLs
export function getAppUrl(): string {
  // Priority order:
  // 1. Explicit environment variable
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // 2. Vercel production URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // 3. Vercel preview/branch URL
  if (process.env.VERCEL_BRANCH_URL) {
    return `https://${process.env.VERCEL_BRANCH_URL}`;
  }
  
  // 4. Vercel environment (for SSR/API routes)
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  
  // 5. Fallback to localhost
  return 'http://localhost:3000';
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || 
         !!process.env.VERCEL || 
         !!process.env.VERCEL_URL;
}

export function isLocalhost(): boolean {
  const url = getAppUrl();
  return url.includes('localhost') || url.includes('127.0.0.1') || url.includes('0.0.0.0');
}

// For creating absolute URLs (useful for emails, redirects, etc.)
export function createAbsoluteUrl(path: string = ''): string {
  const baseUrl = getAppUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
