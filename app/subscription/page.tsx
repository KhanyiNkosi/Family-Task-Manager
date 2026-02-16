'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabaseClient } from '@/lib/supabaseClient';
import { usePremium } from '@/hooks/usePremium';
import ProfileIcon from '@/app/components/ProfileIcon';

interface SubscriptionData {
  subscription_status: string;
  subscription_starts_at: string | null;
  subscription_renews_at: string | null;
  license_key: string | null;
  lemonsqueezy_order_id: string | null;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { isPremium, isLoading: premiumLoading, subscriptionStatus, renewsAt } = usePremium();
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [alertModal, setAlertModal] = useState({ show: false, message: '', type: 'info' as 'info' | 'success' | 'error' });

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserEmail(user.email || '');

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, subscription_status, subscription_starts_at, subscription_renews_at, license_key, lemonsqueezy_order_id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading subscription:', error);
        setAlertModal({ show: true, message: 'Failed to load subscription data', type: 'error' });
      } else {
        setUserName(profile.full_name || 'User');
        setSubscriptionData({
          subscription_status: profile.subscription_status,
          subscription_starts_at: profile.subscription_starts_at,
          subscription_renews_at: profile.subscription_renews_at,
          license_key: profile.license_key,
          lemonsqueezy_order_id: profile.lemonsqueezy_order_id,
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setAlertModal({ show: true, message: 'An error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setAlertModal({
      show: true,
      message: 'To cancel your subscription, please contact support@familytask.co or manage it directly from your Lemon Squeezy customer dashboard.',
      type: 'info'
    });
    setShowCancelModal(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilRenewal = (renewDate: string | null) => {
    if (!renewDate) return null;
    const now = new Date();
    const renew = new Date(renewDate);
    const days = Math.ceil((renew.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading || premiumLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  const daysUntilRenewal = getDaysUntilRenewal(subscriptionData?.subscription_renews_at || null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <ProfileIcon />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between pr-16">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <button
                onClick={() => router.back()}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition flex-shrink-0"
              >
                ← Back
              </button>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold truncate">💎 Subscription</h1>
                <p className="text-purple-100 text-sm truncate">Manage your subscription</p>
              </div>
            </div>
            <div className="text-right hidden sm:block flex-shrink-0">
              <p className="text-sm text-purple-100 truncate">{userName}</p>
              <p className="text-xs text-purple-200">{userEmail}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Status Card */}
        <div className={`rounded-2xl shadow-xl p-8 mb-8 ${
          isPremium
            ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white'
            : 'bg-white border-2 border-gray-200'
        }`}>
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{isPremium ? '👑' : '🎯'}</div>
            <h2 className="text-3xl font-bold mb-2">
              {isPremium ? 'Premium Member' : 'Free Plan'}
            </h2>
            <p className={`text-lg ${isPremium ? 'text-purple-100' : 'text-gray-600'}`}>
              {isPremium
                ? 'You have access to all premium features!'
                : 'Upgrade to unlock advanced features'}
            </p>
          </div>

          {isPremium && subscriptionData && (
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <p className="text-purple-100 text-sm mb-1">Status</p>
                <p className="text-xl font-semibold capitalize">{subscriptionData.subscription_status}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <p className="text-purple-100 text-sm mb-1">Started</p>
                <p className="text-xl font-semibold">{formatDate(subscriptionData.subscription_starts_at)}</p>
              </div>
              {subscriptionData.subscription_renews_at && (
                <>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <p className="text-purple-100 text-sm mb-1">Renews On</p>
                    <p className="text-xl font-semibold">{formatDate(subscriptionData.subscription_renews_at)}</p>
                  </div>
                  {daysUntilRenewal !== null && (
                    <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                      <p className="text-purple-100 text-sm mb-1">Days Until Renewal</p>
                      <p className="text-xl font-semibold">{daysUntilRenewal} days</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-2xl mr-2">✨</span>
              Premium Features
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className={`mr-2 ${isPremium ? 'text-green-500' : 'text-gray-300'}`}>✓</span>
                <span className={isPremium ? 'text-gray-700' : 'text-gray-400'}>Unlimited children</span>
              </li>
              <li className="flex items-start">
                <span className={`mr-2 ${isPremium ? 'text-green-500' : 'text-gray-300'}`}>✓</span>
                <span className={isPremium ? 'text-gray-700' : 'text-gray-400'}>Photo verification</span>
              </li>
              <li className="flex items-start">
                <span className={`mr-2 ${isPremium ? 'text-green-500' : 'text-gray-300'}`}>✓</span>
                <span className={isPremium ? 'text-gray-700' : 'text-gray-400'}>Custom rewards</span>
              </li>
              <li className="flex items-start">
                <span className={`mr-2 ${isPremium ? 'text-green-500' : 'text-gray-300'}`}>✓</span>
                <span className={isPremium ? 'text-gray-700' : 'text-gray-400'}>Recurring tasks</span>
              </li>
              <li className="flex items-start">
                <span className={`mr-2 ${isPremium ? 'text-green-500' : 'text-gray-300'}`}>✓</span>
                <span className={isPremium ? 'text-gray-700' : 'text-gray-400'}>Priority support</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-2xl mr-2">🎯</span>
              Free Features
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-700">1 child</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-700">Basic task management</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-700">Points & rewards</span>
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
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {isPremium ? (
            <>
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex-1 py-3 px-6 bg-white border-2 border-red-500 text-red-500 rounded-lg font-semibold hover:bg-red-50 transition"
              >
                Cancel Subscription
              </button>
              <button
                onClick={() => window.open('https://app.lemonsqueezy.com/my-orders', '_blank')}
                className="flex-1 py-3 px-6 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
              >
                Manage in Lemon Squeezy
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push('/pricing')}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition"
              >
                Upgrade to Premium
              </button>
              <button
                onClick={() => router.back()}
                className="flex-1 py-3 px-6 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Maybe Later
              </button>
            </>
          )}
        </div>

        {/* License Key */}
        {isPremium && subscriptionData?.license_key && (
          <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-2">License Key</h3>
            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-white px-4 py-2 rounded border border-gray-300 font-mono text-sm text-gray-700">
                {subscriptionData.license_key}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(subscriptionData.license_key!);
                  setAlertModal({ show: true, message: 'License key copied!', type: 'success' });
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Cancel Subscription?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your premium subscription? You'll lose access to premium features at the end of your billing period.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Keep Premium
              </button>
              <button
                onClick={handleCancelSubscription}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal.show && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setAlertModal({ show: false, message: '', type: 'info' })}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-6 ${
              alertModal.type === 'error' ? 'bg-red-50' :
              alertModal.type === 'success' ? 'bg-green-50' :
              'bg-blue-50'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`text-3xl ${
                  alertModal.type === 'error' ? 'text-red-500' :
                  alertModal.type === 'success' ? 'text-green-500' :
                  'text-blue-500'
                }`}>
                  {alertModal.type === 'error' ? '❌' :
                   alertModal.type === 'success' ? '✅' : 'ℹ️'}
                </div>
                <p className="text-gray-800 font-medium">{alertModal.message}</p>
              </div>
            </div>
            <div className="p-4 bg-white">
              <button
                onClick={() => setAlertModal({ show: false, message: '', type: 'info' })}
                className="w-full py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
