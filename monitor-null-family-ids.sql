-- ============================================================================
-- MONITORING: Check for Users with NULL family_id
-- ============================================================================
-- Run this periodically (daily/weekly) to catch registration issues
-- ============================================================================

-- Alert if any users have NULL family_id
DO $$
DECLARE
  v_null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_null_count
  FROM profiles
  WHERE family_id IS NULL;
  
  IF v_null_count > 0 THEN
    RAISE WARNING '⚠️  ALERT: % user(s) have NULL family_id - manual intervention needed', v_null_count;
  ELSE
    RAISE NOTICE '✅ All users have family_id assigned';
  END IF;
END $$;

-- Show affected users with details
SELECT 
  id,
  SUBSTRING(email, 1, 40) as email,
  role,
  created_at,
  '❌ NULL FAMILY_ID - NEEDS FIX' as status
FROM profiles
WHERE family_id IS NULL
ORDER BY created_at DESC;

-- Count by role
SELECT 
  role,
  COUNT(*) as null_family_count,
  '⚠️ ACTION REQUIRED' as alert
FROM profiles
WHERE family_id IS NULL
GROUP BY role;

-- If results found, run: backfill-null-family-id.sql
