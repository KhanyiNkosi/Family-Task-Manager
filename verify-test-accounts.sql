-- ============================================================================
-- DRY RUN: VERIFY TEST ACCOUNTS EXIST
-- ============================================================================
-- Run this FIRST to check which of your test emails exist in the database
-- SAFE to run - this only reads data, makes no changes
-- ============================================================================

-- Check which of your test emails exist in profiles table
SELECT 
  email,
  full_name,
  created_at,
  subscription_status,
  CASE 
    WHEN subscription_status = 'active' AND subscription_renews_at > NOW() 
    THEN '✅ PREMIUM ACTIVE'
    WHEN subscription_status = 'active' AND subscription_renews_at <= NOW()
    THEN '⚠️ PREMIUM EXPIRED'
    WHEN subscription_status = 'free' OR subscription_status IS NULL
    THEN '❌ FREE TIER'
    ELSE '⚠️ ' || subscription_status
  END as current_access,
  (
    SELECT role 
    FROM user_profiles 
    WHERE user_profiles.id = profiles.id
  ) as role,
  family_id
FROM profiles
WHERE email IN (
  'mvaleliso.mdluli@gmail.com',
  'nqobileoctavia24@gmail.com',
  'emeldahlatshwayo59@gmail.com',
  'hlatshwayonoluthando02@gmail.com',
  'kometsilwandle@gmail.com',
  'nkosik8@gmail.com'
)
ORDER BY email;

-- Summary: How many accounts found vs expected
DO $$
DECLARE
  v_found_count INT;
  v_expected_count INT := 6;
BEGIN
  SELECT COUNT(*) INTO v_found_count
  FROM profiles
  WHERE email IN (
    'mvaleliso.mdluli@gmail.com',
    'nqobileoctavia24@gmail.com',
    'emeldahlatshwayo59@gmail.com',
    'hlatshwayonoluthando02@gmail.com',
    'kometsilwandle@gmail.com',
    'nkosik8@gmail.com'
  );
  
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'TEST ACCOUNTS VERIFICATION';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Expected accounts: %', v_expected_count;
  RAISE NOTICE 'Found accounts:    %', v_found_count;
  
  IF v_found_count = v_expected_count THEN
    RAISE NOTICE 'Status: ✅ All test accounts found!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Safe to proceed with STEP 2 (Activate Premium)';
  ELSIF v_found_count > 0 THEN
    RAISE NOTICE 'Status: ⚠️ Only % of % accounts found', v_found_count, v_expected_count;
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ Check which emails are missing and verify spelling';
  ELSE
    RAISE NOTICE 'Status: ❌ No test accounts found!';
    RAISE NOTICE '';
    RAISE NOTICE '❌ Verify that users have registered with these emails';
  END IF;
  
  RAISE NOTICE '====================================';
END $$;

-- Check if any of these accounts already have children
SELECT 
  p.email,
  p.full_name,
  up.role,
  COUNT(children.id) as children_count,
  CASE 
    WHEN COUNT(children.id) = 0 THEN '✅ No children yet'
    WHEN COUNT(children.id) = 1 THEN '✅ 1 child (at free tier limit)'
    WHEN COUNT(children.id) > 1 THEN '⚠️ ' || COUNT(children.id) || ' children (needs premium)'
  END as status
FROM profiles p
LEFT JOIN user_profiles up ON up.id = p.id
LEFT JOIN profiles children ON children.family_id = p.family_id AND children.id != p.id
WHERE p.email IN (
  'mvaleliso.mdluli@gmail.com',
  'nqobileoctavia24@gmail.com',
  'emeldahlatshwayo59@gmail.com',
  'hlatshwayonoluthando02@gmail.com',
  'kometsilwandle@gmail.com',
  'nkosik8@gmail.com'
)
AND up.role = 'parent'
GROUP BY p.email, p.full_name, up.role
ORDER BY children_count DESC;

-- ============================================================================
-- NEXT STEPS AFTER VERIFICATION:
-- ============================================================================
-- ✅ If all accounts found:
--    → Open activate-premium-for-testing.sql
--    → Run STEP 2 to activate premium on all 6 accounts
--
-- ⚠️ If some accounts missing:
--    → Check spelling of emails
--    → Verify users have completed registration
--    → Update emails in both SQL files
-- ============================================================================
