'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabaseClient } from '@/lib/supabaseClient';
import { usePremium } from '@/hooks/usePremium';
import { PremiumBadge } from '@/components/PremiumGuard';

export default function PricingPage() {
  const router = useRouter();
  const { isPremium, isLoading } = usePremium();
  const [userEmail, setUserEmail] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const supabase = createClientSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setUserId(user.id);
      setUserEmail(user.email || '');
    }
  };

  const handleCheckout = (checkoutUrl: string) => {
    // Add user_id and email as custom data for webhook
    const url = new URL(checkoutUrl);
    url.searchParams.set('checkout[email]', userEmail);
    url.searchParams.set('checkout[custom][user_id]', userId);
    
    // Open checkout in new tab
    window.open(url.toString(), '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              ← Back
            </button>
            {isPremium && <PremiumBadge />}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upgrade to Premium and unlock advanced features to supercharge your family's productivity! 🚀
          </p>
        </div>

        {/* Current Status */}
        {isPremium && (
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-xl p-6 mb-12 text-center">
            <div className="text-4xl mb-2">👑</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">You're a Premium Member!</h3>
            <p className="text-gray-700">
              Thank you for supporting Family Task Manager. You have access to all premium features.
            </p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Free</h3>
              <div className="text-4xl font-bold text-gray-900 mb-2">$0</div>
              <p className="text-gray-600">Forever free</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-700">Up to 3 children</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-700">Basic task management</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-700">Points & rewards system</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-700">Achievement badges</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-700">Activity feed</span>
              </li>
            </ul>
            <button
              disabled={true}
              className="w-full py-3 px-6 rounded-lg font-semibold bg-gray-200 text-gray-500 cursor-not-allowed"
            >
              Current Plan
            </button>
          </div>

          {/* Monthly Plan */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-400 relative transform hover:scale-105 transition">
            <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm font-semibold">
              Popular
            </div>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Monthly</h3>
              <div className="text-4xl font-bold text-purple-600 mb-2">$4.99</div>
              <p className="text-gray-600">per month</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">✓</span>
                <span className="text-gray-700 font-semibold">Everything in Free</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">✓</span>
                <span className="text-gray-700">Unlimited children</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">✓</span>
                <span className="text-gray-700">Photo verification</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">✓</span>
                <span className="text-gray-700">Custom rewards</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">✓</span>
                <span className="text-gray-700">Recurring tasks</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">✓</span>
                <span className="text-gray-700">Priority support</span>
              </li>
            </ul>
            <button
              onClick={() => handleCheckout('https://your-store.lemonsqueezy.com/checkout/buy/your-monthly-variant')}
              disabled={isPremium}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition ${
                isPremium
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {isPremium ? 'Already Premium' : 'Get Started'}
            </button>
          </div>

          {/* Yearly Plan */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl shadow-xl p-8 transform hover:scale-105 transition">
            <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm font-bold">
              Save 40%
            </div>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Yearly</h3>
              <div className="text-4xl font-bold mb-2">$35.99</div>
              <p className="text-purple-100">$2.99/month billed annually</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="text-yellow-300 mr-2">✓</span>
                <span className="font-semibold">Everything in Monthly</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-300 mr-2">✓</span>
                <span>Save $24/year</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-300 mr-2">✓</span>
                <span>Early access to new features</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-300 mr-2">✓</span>
                <span>Exclusive badges</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-300 mr-2">✓</span>
                <span>VIP support</span>
              </li>
            </ul>
            <button
              onClick={() => handleCheckout('https://your-store.lemonsqueezy.com/checkout/buy/your-yearly-variant')}
              disabled={isPremium}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition ${
                isPremium
                  ? 'bg-white/30 text-white cursor-not-allowed'
                  : 'bg-white text-purple-600 hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {isPremium ? 'Already Premium' : 'Best Value!'}
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-bold text-lg mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">
                Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-bold text-lg mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards (Visa, MasterCard, American Express) via our secure payment processor Lemon Squeezy.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-bold text-lg mb-2">Can I switch between plans?</h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time from your account settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
