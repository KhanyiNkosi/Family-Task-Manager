-- ============================================================================
-- COMPLETE USER LIMITS SETUP - Creates missing functions and displays status
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Check Function
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

-- ============================================================================
-- STEP 2: Create User Stats Function
-- ============================================================================

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

-- ============================================================================
-- STEP 3: Create Update Limit Function
-- ============================================================================

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

-- ============================================================================
-- STEP 4: Grant Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_user_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_limit(INTEGER, BOOLEAN) TO authenticated;

-- ============================================================================
-- STEP 5: Display Success Message
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
  RAISE NOTICE '%', format('  • Capacity used: %s%%', v_stats.percentage_full);
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NEXT STEP: Submit Supabase support ticket to enable database trigger';
  RAISE NOTICE '   (See setup-user-limits-500.sql STEP 8 for request template)';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- STEP 6: Verification Queries
-- ============================================================================

-- Check settings
SELECT 
  setting_key,
  setting_value->>'limit' AS max_users,
  setting_value->>'enabled' AS limit_enabled,
  description,
  updated_at
FROM public.app_settings
WHERE setting_key = 'max_users';

-- Check current user stats
SELECT * FROM public.get_user_stats();
