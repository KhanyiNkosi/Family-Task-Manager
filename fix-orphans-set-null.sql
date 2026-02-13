-- ============================================================================
-- OPTION B: SET ORPHANED PROFILES' family_id TO NULL
-- ============================================================================
-- This removes invalid family_id references from profiles
-- Run this if the orphaned family links are stale/invalid
-- ============================================================================

-- Show what will be updated before we do it
SELECT 
  'Profiles that will be updated' as check_name,
  p.id,
  p.email,
  p.role,
  p.family_id as current_invalid_family_id
FROM profiles p
WHERE p.family_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM families f WHERE f.id = p.family_id
  );

-- Perform the update
DO $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Setting orphaned family_ids to NULL...';
  RAISE NOTICE '====================================';
  
  UPDATE profiles
  SET 
    family_id = NULL,
    updated_at = NOW()
  WHERE family_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM families f WHERE f.id = family_id
    );
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RAISE NOTICE '✅ Updated % profiles', v_updated_count;
  RAISE NOTICE '====================================';
END $$;

-- Verify the fix
SELECT 
  'Verification: Orphaned profiles after fix' as check_name,
  COUNT(*) as remaining_orphans
FROM profiles p
WHERE p.family_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM families f WHERE f.id = p.family_id
  );

-- Show profiles that were updated (now have NULL family_id and recent updated_at)
SELECT 
  'Updated Profiles' as check_name,
  p.id,
  p.email,
  p.role,
  p.family_id as new_family_id,
  p.updated_at
FROM profiles p
WHERE p.family_id IS NULL
  AND p.updated_at > NOW() - INTERVAL '5 minutes'
ORDER BY p.updated_at DESC;

-- Summary of profiles by family_id status
SELECT 
  'Profile Family Status Summary' as check_name,
  CASE 
    WHEN p.family_id IS NULL THEN 'No family assigned'
    WHEN EXISTS (SELECT 1 FROM families f WHERE f.id = p.family_id) THEN 'Valid family'
    ELSE 'Orphaned (should not exist)'
  END as status,
  COUNT(*) as count
FROM profiles p
GROUP BY 
  CASE 
    WHEN p.family_id IS NULL THEN 'No family assigned'
    WHEN EXISTS (SELECT 1 FROM families f WHERE f.id = p.family_id) THEN 'Valid family'
    ELSE 'Orphaned (should not exist)'
  END;
