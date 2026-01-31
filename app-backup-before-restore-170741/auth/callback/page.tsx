// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase will handle the OAuth/email callback automatically
      // We just need to redirect after a brief delay
      setTimeout(() => {
        router.push("/login?confirmed=true");
      }, 2000);
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-gray-800">Completing sign in...</h2>
        <p className="text-gray-600 mt-2">Please wait a moment</p>
      </div>
    </div>
  );
}
