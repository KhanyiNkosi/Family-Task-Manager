-- ============================================================================
-- FIX: Corrected DO block with proper RAISE NOTICE formatting
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

-- Verify settings are correct
SELECT 
  setting_key,
  setting_value,
  description,
  updated_at
FROM public.app_settings
WHERE setting_key = 'max_users';

-- Check current user stats
SELECT * FROM public.get_user_stats();
