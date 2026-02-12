-- ============================================================================
-- ADD PREMIUM SUBSCRIPTION SUPPORT
-- ============================================================================
-- Adds license key and subscription tracking to profiles table
-- Safe to run multiple times (idempotent)
-- ============================================================================

-- Add license key columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS license_key TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'cancelled', 'expired')),
ADD COLUMN IF NOT EXISTS subscription_starts_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_renews_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS lemonsqueezy_order_id TEXT,
ADD COLUMN IF NOT EXISTS lemonsqueezy_customer_id TEXT;

-- Create index for license key lookups
CREATE INDEX IF NOT EXISTS idx_profiles_license_key ON profiles(license_key);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);

-- Add helpful comment
COMMENT ON COLUMN profiles.license_key IS 'Lemon Squeezy license key for premium subscription';
COMMENT ON COLUMN profiles.subscription_status IS 'Subscription status: free, active, cancelled, expired';
COMMENT ON COLUMN profiles.subscription_starts_at IS 'When subscription started';
COMMENT ON COLUMN profiles.subscription_renews_at IS 'When subscription renews/expires';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Premium subscription support added successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'New columns added to profiles:';
  RAISE NOTICE '  • license_key (unique)';
  RAISE NOTICE '  • subscription_status (free/active/cancelled/expired)';
  RAISE NOTICE '  • subscription_starts_at';
  RAISE NOTICE '  • subscription_renews_at';
  RAISE NOTICE '  • lemonsqueezy_order_id';
  RAISE NOTICE '  • lemonsqueezy_customer_id';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Deploy Supabase Edge Function for webhooks';
  RAISE NOTICE '  2. Configure Lemon Squeezy webhook URL';
  RAISE NOTICE '  3. Add license validation to your app';
END $$;
