-- Fix Missing Family Issue
-- Problem: User has family_id but it doesn't exist in families table
-- This causes activity_feed foreign key constraint violation

-- Step 1: Check for profiles with missing families
SELECT 
  p.id as profile_id,
  p.full_name,
  p.role,
  p.family_id,
  CASE 
    WHEN f.id IS NULL THEN 'MISSING'
    ELSE 'EXISTS'
  END as family_status
FROM profiles p
LEFT JOIN families f ON p.family_id = f.id
WHERE p.family_id IS NOT NULL
ORDER BY family_status DESC, p.full_name;

-- Step 2: Create missing family records
-- This will create a family entry for each orphaned family_id
INSERT INTO families (id, family_code, created_at, created_by)
SELECT DISTINCT 
  p.family_id,
  SUBSTRING(MD5(p.family_id::text) FROM 1 FOR 8), -- Generate a unique code
  NOW(),
  (SELECT id FROM profiles WHERE family_id = p.family_id AND role = 'parent' LIMIT 1) -- Use first parent as creator
FROM profiles p
LEFT JOIN families f ON p.family_id = f.id
WHERE p.family_id IS NOT NULL 
  AND f.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 3: Verify the fix
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN p.family_id IS NOT NULL THEN 1 END) as profiles_with_family,
  COUNT(CASE WHEN p.family_id IS NOT NULL AND f.id IS NULL THEN 1 END) as orphaned_profiles
FROM profiles p
LEFT JOIN families f ON p.family_id = f.id;

-- Step 4: Check the specific family_id from the error
SELECT 
  f.id,
  f.family_code,
  f.created_at,
  COUNT(p.id) as member_count
FROM families f
LEFT JOIN profiles p ON p.family_id = f.id
WHERE f.id = '519e50cd-5459-4ade-936a-671ea9bea488'
GROUP BY f.id, f.family_code, f.created_at;
