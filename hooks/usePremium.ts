import { useState, useEffect } from 'react';
import { createClientSupabaseClient } from '@/lib/supabaseClient';

interface PremiumStatus {
  isPremium: boolean;
  isLoading: boolean;
  subscriptionStatus: string | null;
  renewsAt: string | null;
  error: string | null;
}

export function usePremium(): PremiumStatus {
  const [status, setStatus] = useState<PremiumStatus>({
    isPremium: false,
    isLoading: true,
    subscriptionStatus: null,
    renewsAt: null,
    error: null,
  });

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setStatus({
          isPremium: false,
          isLoading: false,
          subscriptionStatus: 'free',
          renewsAt: null,
          error: null,
        });
        return;
      }

      // Call API to check premium status
      const response = await fetch(`/api/check-premium?userId=${user.id}`);
      const data = await response.json();

      if (response.ok) {
        setStatus({
          isPremium: data.isPremium,
          isLoading: false,
          subscriptionStatus: data.subscriptionStatus,
          renewsAt: data.renewsAt,
          error: null,
        });
      } else {
        setStatus({
          isPremium: false,
          isLoading: false,
          subscriptionStatus: 'free',
          renewsAt: null,
          error: data.error,
        });
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
      setStatus({
        isPremium: false,
        isLoading: false,
        subscriptionStatus: 'free',
        renewsAt: null,
        error: 'Failed to check premium status',
      });
    }
  };

  return status;
}
