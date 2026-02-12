'use client';

import React from 'react';
import { usePremium } from '@/hooks/usePremium';
import { useRouter } from 'next/navigation';

interface PremiumGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export default function PremiumGuard({ 
  children, 
  fallback,
  redirectTo 
}: PremiumGuardProps) {
  const { isPremium, isLoading } = usePremium();
  const router = useRouter();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // If not premium, show fallback or redirect
  if (!isPremium) {
    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    // Default upgrade prompt
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-8 text-center">
        <div className="text-6xl mb-4">👑</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Premium Feature</h3>
        <p className="text-gray-600 mb-6">
          Upgrade to Premium to unlock this feature and support the development of this app!
        </p>
        <button
          onClick={() => router.push('/pricing')}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition"
        >
          View Pricing Plans
        </button>
      </div>
    );
  }

  // User is premium, show the protected content
  return <>{children}</>;
}

// Badge component to show premium status
export function PremiumBadge() {
  const { isPremium, isLoading } = usePremium();

  if (isLoading || !isPremium) return null;

  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md">
      <span className="mr-1">👑</span>
      Premium
    </span>
  );
}
