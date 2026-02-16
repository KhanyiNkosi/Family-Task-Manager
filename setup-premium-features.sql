-- ============================================================================
-- PREMIUM FEATURES SETUP - Lemon Squeezy Integration
-- ============================================================================
-- Adds premium subscription support with Lemon Squeezy payment integration
-- ============================================================================

-- ============================================================================
-- STEP 1: Add Premium Columns to Profiles
-- ============================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS premium_status TEXT DEFAULT 'free' CHECK (premium_status IN ('free', 'premium', 'lifetime')),
ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS lemonsqueezy_customer_id TEXT,
ADD COLUMN IF NOT EXISTS lemonsqueezy_subscription_id TEXT;

COMMENT ON COLUMN public.profiles.premium_status IS 'User premium status: free, premium, or lifetime';
COMMENT ON COLUMN public.profiles.premium_expires_at IS 'When the premium subscription expires (null for lifetime)';

-- ============================================================================
-- STEP 2: Create Subscriptions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Lemon Squeezy IDs
  lemonsqueezy_subscription_id TEXT UNIQUE,
  lemonsqueezy_customer_id TEXT,
  lemonsqueezy_order_id TEXT,
  lemonsqueezy_product_id TEXT,
  lemonsqueezy_variant_id TEXT,
  
  -- Status and billing
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'paused')),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly', 'lifetime')),
  billing_amount DECIMAL(10, 2),
  billing_currency TEXT DEFAULT 'USD',
  
  -- Timestamps
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.subscriptions IS 'Tracks Lemon Squeezy subscription status and billing';

-- ============================================================================
-- STEP 3: Create Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_lemonsqueezy_id ON public.subscriptions(lemonsqueezy_subscription_id);
CREATE INDEX IF NOT EXISTS idx_profiles_premium_status ON public.profiles(premium_status);

-- ============================================================================
-- STEP 4: Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "No direct insert on subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "No direct update on subscriptions" ON public.subscriptions;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Only webhooks/system can insert
CREATE POLICY "No direct insert on subscriptions"
  ON public.subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Only webhooks/system can update
CREATE POLICY "No direct update on subscriptions"
  ON public.subscriptions FOR UPDATE
  TO authenticated
  USING (false);

-- ============================================================================
-- STEP 5: Create Premium Check Function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_premium_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_premium BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM public.profiles p
    WHERE p.id = p_user_id
    AND (
      -- Has active premium status
      p.premium_status IN ('premium', 'lifetime')
      -- And subscription hasn't expired (or is lifetime)
      AND (
        p.premium_status = 'lifetime'
        OR p.premium_expires_at > NOW()
      )
    )
  ) INTO v_is_premium;
  
  RETURN v_is_premium;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_premium_user(UUID) IS 'Check if user has active premium access';

GRANT EXECUTE ON FUNCTION public.is_premium_user(UUID) TO anon, authenticated;

-- ============================================================================
-- STEP 6: Create Function to Get Subscription Details
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_subscription(p_user_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  status TEXT,
  plan_type TEXT,
  premium_status TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  billing_amount DECIMAL,
  billing_currency TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.status,
    s.plan_type,
    p.premium_status,
    p.premium_expires_at,
    s.billing_amount,
    s.billing_currency
  FROM public.profiles p
  LEFT JOIN public.subscriptions s ON s.user_id = p.id AND s.status = 'active'
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_subscription(UUID) IS 'Get user subscription details';

GRANT EXECUTE ON FUNCTION public.get_user_subscription(UUID) TO authenticated;

-- ============================================================================
-- STEP 7: Grant Permissions
-- ============================================================================

GRANT SELECT ON public.subscriptions TO authenticated;

-- ============================================================================
-- STEP 8: Verification Queries
-- ============================================================================

-- Check if premium columns exist
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('premium_status', 'premium_expires_at', 'lemonsqueezy_customer_id', 'lemonsqueezy_subscription_id');

-- Check subscriptions table
SELECT 
  table_name,
  obj_description((table_schema || '.' || table_name)::regclass, 'pg_class') AS table_comment
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'subscriptions';

-- ============================================================================
-- SUCCESS!
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║         PREMIUM FEATURES CONFIGURED                            ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Premium columns added to profiles table';
  RAISE NOTICE '✅ Subscriptions table created';
  RAISE NOTICE '✅ Indexes created for performance';
  RAISE NOTICE '✅ RLS policies enabled';
  RAISE NOTICE '✅ Premium check functions created';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NEXT STEPS:';
  RAISE NOTICE '   1. Install Lemon Squeezy SDK: npm install @lemonsqueezy/lemonsqueezy.js';
  RAISE NOTICE '   2. Add environment variables to .env.local';
  RAISE NOTICE '   3. Create products in Lemon Squeezy dashboard';
  RAISE NOTICE '   4. Deploy API routes and webhook handler';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
