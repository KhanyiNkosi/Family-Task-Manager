-- ============================================================================
-- PREMIUM SUBSCRIPTION TESTING SCRIPT
-- ============================================================================
-- Use this to manually activate/deactivate premium on test accounts
-- BEFORE setting up Lemon Squeezy payment integration
-- ============================================================================

-- ============================================================================
-- STEP 1: VIEW ALL ACCOUNTS AND THEIR SUBSCRIPTION STATUS
-- ============================================================================
-- Run this first to see all your accounts
SELECT 
  id,
  email,
  full_name,
  subscription_status,
  subscription_starts_at,
  subscription_renews_at,
  license_key,
  CASE 
    WHEN subscription_status = 'active' AND subscription_renews_at > NOW() 
    THEN '✅ PREMIUM ACTIVE'
    WHEN subscription_status = 'active' AND subscription_renews_at <= NOW()
    THEN '⚠️ PREMIUM EXPIRED'
    ELSE '❌ FREE TIER'
  END as current_access
FROM profiles
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 2: ACTIVATE PREMIUM FOR SPECIFIC EMAIL(S)
-- ============================================================================
-- Replace 'your-email@example.com' with your actual test account email
-- You can run this multiple times for different emails

UPDATE profiles
SET 
  subscription_status = 'active',
  subscription_starts_at = NOW(),
  subscription_renews_at = NOW() + INTERVAL '1 year',  -- Valid for 1 year
  license_key = 'TEST-' || substring(gen_random_uuid()::text, 1, 8)
WHERE email = 'your-email@example.com';  -- 👈 CHANGE THIS EMAIL

-- OR activate multiple accounts at once:
UPDATE profiles
SET 
  subscription_status = 'active',
  subscription_starts_at = NOW(),
  subscription_renews_at = NOW() + INTERVAL '1 year',
  license_key = 'TEST-' || substring(gen_random_uuid()::text, 1, 8)
WHERE email IN (
  'parent1@example.com',    -- 👈 CHANGE THESE
  'parent2@example.com',    -- 👈 CHANGE THESE
  'child1@example.com'      -- 👈 CHANGE THESE
);

-- ============================================================================
-- STEP 3: ACTIVATE PREMIUM FOR ALL PARENT ACCOUNTS (BE CAREFUL!)
-- ============================================================================
-- This activates premium for ALL parent accounts
-- Uncomment only if you want to test with all parents having premium

-- UPDATE profiles
-- SET 
--   subscription_status = 'active',
--   subscription_starts_at = NOW(),
--   subscription_renews_at = NOW() + INTERVAL '1 year',
--   license_key = 'TEST-' || substring(gen_random_uuid()::text, 1, 8)
-- WHERE id IN (
--   SELECT id FROM user_profiles WHERE role = 'parent'
-- );

-- ============================================================================
-- STEP 4: REVOKE PREMIUM (Set back to FREE tier)
-- ============================================================================
-- Use this to remove premium from an account for testing free tier limits

UPDATE profiles
SET 
  subscription_status = 'free',
  subscription_starts_at = NULL,
  subscription_renews_at = NULL,
  license_key = NULL
WHERE email = 'your-email@example.com';  -- 👈 CHANGE THIS EMAIL

-- Or revoke from multiple accounts:
UPDATE profiles
SET 
  subscription_status = 'free',
  subscription_starts_at = NULL,
  subscription_renews_at = NULL,
  license_key = NULL
WHERE email IN (
  'account1@example.com',   -- 👈 CHANGE THESE
  'account2@example.com'    -- 👈 CHANGE THESE
);

-- ============================================================================
-- STEP 5: SIMULATE EXPIRED SUBSCRIPTION
-- ============================================================================
-- Use this to test what happens when a subscription expires

UPDATE profiles
SET 
  subscription_status = 'expired',
  subscription_renews_at = NOW() - INTERVAL '1 day'  -- Expired yesterday
WHERE email = 'your-email@example.com';  -- 👈 CHANGE THIS EMAIL

-- ============================================================================
-- STEP 6: SIMULATE CANCELLED SUBSCRIPTION
-- ============================================================================
-- User still has access until renewal date, but won't auto-renew

UPDATE profiles
SET 
  subscription_status = 'cancelled',
  subscription_renews_at = NOW() + INTERVAL '30 days'  -- 30 days left
WHERE email = 'your-email@example.com';  -- 👈 CHANGE THIS EMAIL

-- ============================================================================
-- STEP 7: VIEW PREMIUM FEATURES EACH ACCOUNT CAN ACCESS
-- ============================================================================
-- Check what premium features are unlocked for your test accounts

SELECT 
  p.email,
  p.full_name,
  p.subscription_status,
  CASE 
    WHEN p.subscription_status = 'active' AND p.subscription_renews_at > NOW() 
    THEN 'YES' 
    ELSE 'NO' 
  END as can_upload_photos,
  CASE 
    WHEN p.subscription_status = 'active' AND p.subscription_renews_at > NOW() 
    THEN 'UNLIMITED' 
    ELSE '1 CHILD ONLY' 
  END as child_limit,
  CASE 
    WHEN p.subscription_status = 'active' AND p.subscription_renews_at > NOW() 
    THEN 'YES' 
    ELSE 'NO' 
  END as can_create_custom_rewards,
  (
    SELECT COUNT(*) 
    FROM profiles children 
    WHERE children.family_id = p.family_id 
    AND children.id != p.id
  ) as current_children_count
FROM profiles p
WHERE id IN (SELECT id FROM user_profiles WHERE role = 'parent')
ORDER BY p.email;

-- ============================================================================
-- STEP 8: RESET ALL TEST ACCOUNTS TO FREE (Nuclear option)
-- ============================================================================
-- Uncomment ONLY if you want to reset ALL accounts to free tier
-- This is useful when starting fresh tests

-- UPDATE profiles
-- SET 
--   subscription_status = 'free',
--   subscription_starts_at = NULL,
--   subscription_renews_at = NULL,
--   license_key = NULL
-- WHERE subscription_status IS NOT NULL;

-- ============================================================================
-- TESTING CHECKLIST
-- ============================================================================
-- 
-- ✅ FREE TIER TESTS (After running STEP 4 to set account to free):
--    - Try adding 2nd child → Should show upgrade prompt
--    - Try uploading task photo → Should show premium guard
--    - Try creating custom reward → Should show upgrade prompt
--    - View subscription page → Should show "Free Plan"
-- 
-- ✅ PREMIUM TIER TESTS (After running STEP 2 to activate premium):
--    - Add 2nd, 3rd, 4th child → Should work without limit
--    - Upload task photos → Should work normally
--    - Create custom rewards → Should work normally
--    - View subscription page → Should show "Premium Member"
--    - Check subscription management → Should display correct dates
-- 
-- ✅ EXPIRATION TESTS (After running STEP 5):
--    - Access should revert to free tier
--    - Premium features should be locked again
-- 
-- ============================================================================

-- Quick verification after making changes:
SELECT 
  email,
  subscription_status,
  CASE 
    WHEN subscription_status = 'active' AND subscription_renews_at > NOW() 
    THEN '✅ PREMIUM' 
    ELSE '❌ FREE' 
  END as access_level,
  subscription_renews_at
FROM profiles
WHERE email = 'your-email@example.com';  -- 👈 CHANGE THIS

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. These manual updates work BEFORE setting up Lemon Squeezy
-- 2. After Lemon Squeezy is configured, the webhook will handle these updates
-- 3. License keys starting with 'TEST-' are for manual testing only
-- 4. Always check STEP 1 first to see current subscription status
-- 5. Use STEP 7 to verify what features each account can access
-- ============================================================================
