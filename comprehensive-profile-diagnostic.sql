-- ============================================================================
-- COMPREHENSIVE DIAGNOSTIC: All profiles and families
-- ============================================================================
-- No role filter - see everything
-- ============================================================================

-- Check 1: ALL recent profiles (no role filter)
SELECT 
  SUBSTRING(p.email, 1, 40) as email,
  p.role,
  p.family_id as profile_family_id,
  f.id as families_table_id,
  f.owner_id,
  CASE 
    WHEN p.family_id IS NULL THEN '❌ profiles.family_id is NULL'
    WHEN f.id IS NULL THEN '⚠️ family_id exists but NO matching family in families table'
    ELSE '✅ GOOD: Has family_id and family exists'
  END as status,
  p.created_at
FROM profiles p
LEFT JOIN families f ON p.family_id::text = f.id
ORDER BY p.created_at DESC
LIMIT 20;

-- Check 2: Count by role and family_id status
SELECT 
  role,
  CASE 
    WHEN family_id IS NULL THEN 'NULL'
    ELSE 'HAS_FAMILY_ID'
  END as family_status,
  COUNT(*) as count
FROM profiles
GROUP BY role, 
  CASE 
    WHEN family_id IS NULL THEN 'NULL'
    ELSE 'HAS_FAMILY_ID'
  END
ORDER BY role, family_status;

-- Check 3: Specific user from console logs
SELECT 
  id,
  email,
  role,
  family_id,
  created_at,
  updated_at
FROM profiles
WHERE id = 'f6585a32-cfa0-4c8f-9d32-8fc22aed6d95'
   OR email = 'kayteenproton.me@proton.me';

-- Check 4: All families table entries
SELECT 
  id,
  owner_id,
  name,
  invitation_code,
  created_at
FROM families
ORDER BY created_at DESC
LIMIT 10;

-- Check 5: Orphaned profiles (have family_id but no matching family)
SELECT 
  SUBSTRING(p.email, 1, 40) as email,
  p.role,
  p.family_id,
  '⚠️ ORPHANED - family does not exist' as issue
FROM profiles p
LEFT JOIN families f ON p.family_id::text = f.id
WHERE p.family_id IS NOT NULL
  AND f.id IS NULL;
