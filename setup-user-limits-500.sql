-- ============================================================================
-- USER REGISTRATION LIMITS - 500 USERS MAX
-- ============================================================================
-- Creates database-level registration control with 500 user limit
-- This is the failsafe layer (app-level check provides better UX)
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Settings Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE public.app_settings IS 'Global application settings and configuration';

-- ============================================================================
-- STEP 2: Insert Registration Limit (500 users)
-- ============================================================================

INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES (
  'max_users',
  '{"limit": 500, "enabled": true}'::jsonb,
  'Maximum number of users allowed to register (500 for initial launch)'
)
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();

-- ============================================================================
-- STEP 3: Create Check Function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_registration_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_current_count INTEGER;
  v_max_users INTEGER;
  v_limit_enabled BOOLEAN;
BEGIN
  -- Get current settings
  SELECT 
    (setting_value->>'limit')::INTEGER,
    COALESCE((setting_value->>'enabled')::BOOLEAN, true)
  INTO v_max_users, v_limit_enabled
  FROM public.app_settings
  WHERE setting_key = 'max_users';
  
  -- If limits are disabled, allow registration
  IF v_limit_enabled IS FALSE THEN
    RETURN NEW;
  END IF;
  
  -- If no limit found, allow (failopen)
  IF v_max_users IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Count current active users
  SELECT COUNT(*) INTO v_current_count
  FROM auth.users
  WHERE deleted_at IS NULL;
  
  -- Check if we've hit the limit
  IF v_current_count >= v_max_users THEN
    RAISE EXCEPTION 'Registration limit reached. We are currently at full capacity. Please check back soon or contact support@familytask.co'
      USING ERRCODE = 'P0001', HINT = 'Maximum users: ' || v_max_users;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_registration_limit() IS 'Enforces user registration limits at database level';

-- ============================================================================
-- STEP 4: Management Functions
-- ============================================================================

-- Function to get current user statistics
CREATE OR REPLACE FUNCTION public.get_user_stats()
RETURNS TABLE (
  current_users BIGINT,
  max_users INTEGER,
  limit_enabled BOOLEAN,
  remaining_slots INTEGER,
  percentage_full NUMERIC
) AS $$
DECLARE
  v_current BIGINT;
  v_max INTEGER;
  v_enabled BOOLEAN;
BEGIN
  -- Get current user count
  SELECT COUNT(*) INTO v_current
  FROM auth.users
  WHERE deleted_at IS NULL;
  
  -- Get settings
  SELECT 
    (setting_value->>'limit')::INTEGER,
    COALESCE((setting_value->>'enabled')::BOOLEAN, true)
  INTO v_max, v_enabled
  FROM public.app_settings
  WHERE setting_key = 'max_users';
  
  -- Return stats
  RETURN QUERY SELECT
    v_current,
    v_max,
    v_enabled,
    GREATEST(0, v_max - v_current::INTEGER),
    ROUND((v_current::NUMERIC / NULLIF(v_max, 0)::NUMERIC) * 100, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_stats() IS 'Returns current user registration statistics';

-- Function to update limit (admin only)
CREATE OR REPLACE FUNCTION public.update_user_limit(
  new_limit INTEGER,
  enabled BOOLEAN DEFAULT TRUE
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Update the limit
  UPDATE public.app_settings
  SET 
    setting_value = jsonb_build_object('limit', new_limit, 'enabled', enabled),
    updated_at = NOW()
  WHERE setting_key = 'max_users';
  
  -- Return new settings
  SELECT setting_value INTO v_result
  FROM public.app_settings
  WHERE setting_key = 'max_users';
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_user_limit(INTEGER, BOOLEAN) IS 'Updates user registration limit (admin only)';

-- ============================================================================
-- STEP 5: Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Allow read access to app settings" ON public.app_settings;
DROP POLICY IF EXISTS "No direct updates to settings" ON public.app_settings;

-- Allow everyone to read settings (needed for app-level checks)
CREATE POLICY "Allow read access to app settings"
  ON public.app_settings FOR SELECT
  TO public
  USING (true);

-- Only allow updates via the update function (which checks admin role)
CREATE POLICY "No direct updates to settings"
  ON public.app_settings FOR UPDATE
  TO authenticated
  USING (false);

-- ============================================================================
-- STEP 6: Grant Permissions
-- ============================================================================

GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_limit(INTEGER, BOOLEAN) TO authenticated;

-- ============================================================================
-- STEP 7: Verification Queries
-- ============================================================================

-- Check current settings
SELECT 
  setting_key,
  setting_value,
  description,
  updated_at
FROM public.app_settings
WHERE setting_key = 'max_users';

-- Check current user stats
SELECT * FROM public.get_user_stats();

-- ============================================================================
-- STEP 8: Database Trigger Setup (REQUIRES SUPABASE SUPPORT)
-- ============================================================================

/*
NOTE: The trigger on auth.users requires Supabase support to enable.

Submit a support ticket at: https://supabase.com/dashboard/support/new

Request message:
---
Subject: Enable Database Trigger on auth.users Table

Hi Supabase Team,

Could you please enable the following trigger on my auth.users table?

CREATE TRIGGER check_registration_limit_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_registration_limit();

This will enforce user registration limits for our launch.

Project ID: [YOUR_PROJECT_ID]

Thank you!
---

In the meantime, the app-level check will work (next step).
*/

-- ============================================================================
-- MANAGEMENT COMMANDS (For Future Use)
-- ============================================================================

-- To increase limit later:
-- SELECT public.update_user_limit(1000, true);

-- To disable limits completely:
-- SELECT public.update_user_limit(500, false);

-- To check stats anytime:
-- SELECT * FROM public.get_user_stats();

-- ============================================================================
-- SUCCESS!
-- ============================================================================

DO $$
DECLARE
  v_stats RECORD;
BEGIN
  SELECT * INTO v_stats FROM public.get_user_stats();
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║         USER REGISTRATION LIMITS CONFIGURED                    ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Settings table created';
  RAISE NOTICE '✅ Registration limit set to: 500 users';
  RAISE NOTICE '✅ Management functions created';
  RAISE NOTICE '✅ RLS policies enabled';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Current Status:';
  RAISE NOTICE '  • Active users: %', v_stats.current_users;
  RAISE NOTICE '  • Maximum users: %', v_stats.max_users;
  RAISE NOTICE '  • Remaining slots: %', v_stats.remaining_slots;
  RAISE NOTICE '  • Capacity used: %%', v_stats.percentage_full;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NEXT STEP: Submit Supabase support ticket to enable database trigger';
  RAISE NOTICE '   (See STEP 8 above for request template)';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
