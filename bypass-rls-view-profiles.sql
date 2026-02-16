-- ============================================================================
-- BYPASS RLS: View all profiles 
-- ============================================================================
-- RLS policies are blocking normal queries
-- In Supabase SQL Editor: Make sure you're using "Run" (not "Run as RLS")
-- Or toggle OFF the RLS icon in the query editor
-- ============================================================================

-- View ALL profiles (bypasses RLS when run in SQL Editor)
SELECT 
  id,
  SUBSTRING(email, 1, 40) as email,
  role,
  family_id,
  CASE 
    WHEN family_id IS NULL THEN '❌ NULL'
    ELSE '✅ HAS FAMILY'
  END as family_status,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 20;

-- Count by role and family status
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

-- Check specific users from console logs
SELECT 
  id,
  email,
  role,
  family_id,
  created_at
FROM profiles
WHERE id IN (
  'bd1bb7db-f19b-4d16-b61f-42632d414f2e',  -- From console: Parent family owner
  'f6585a32-cfa0-4c8f-9d32-8fc22aed6d95'   -- From console: kayteenproton user
);

-- Match profiles to families
SELECT 
  p.id,
  SUBSTRING(p.email, 1, 40) as email,
  p.role,
  p.family_id as profile_family_id,
  f.id as families_table_id,
  f.owner_id,
  f.invitation_code,
  CASE 
    WHEN p.family_id IS NULL THEN '❌ profiles.family_id is NULL'
    WHEN f.id IS NULL THEN '⚠️ family_id exists but NO matching family in families table'
    WHEN p.family_id::text != f.id THEN '⚠️ TYPE MISMATCH - family_id cast does not match'
    ELSE '✅ GOOD: Has family_id and family exists'
  END as status
FROM profiles p
LEFT JOIN families f ON p.family_id::text = f.id
ORDER BY p.created_at DESC
LIMIT 20;
