-- =============================================================================
-- FIX PROFILES TABLE - ADD ROLE COLUMN AND SYNC FROM USER_PROFILES
-- =============================================================================
-- The reminder feature queries profiles.role but the column doesn't exist!
-- Role is stored in user_profiles table, so we need to:
-- 1. Add role column to profiles
-- 2. Sync it from user_profiles
-- 3. Fix the family_id
-- =============================================================================

-- Step 1: Check current state
SELECT '=== Current Tables ===' as info;

SELECT 'Profiles (missing role)' as table_name, id, email, full_name, family_id 
FROM profiles 
ORDER BY created_at;

SELECT 'User Profiles (has role)' as table_name, id, role, total_points 
FROM user_profiles 
ORDER BY role;

-- Step 2: Add role column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT;

-- Step 3: Sync role from user_profiles to profiles
UPDATE profiles
SET role = user_profiles.role
FROM user_profiles
WHERE profiles.id = user_profiles.id;

-- Step 4: Check the result
SELECT '=== After Adding Role ===' as info;
SELECT id, email, full_name, role, family_id 
FROM profiles 
ORDER BY role;

-- Step 5: Fix family_id - set all children to use parent's family_id
UPDATE profiles
SET family_id = (
  SELECT family_id 
  FROM profiles 
  WHERE role = 'parent' 
  LIMIT 1
)
WHERE role = 'child';

-- Step 6: Final verification
SELECT '=== FINAL STATE ===' as info;
SELECT role, full_name, family_id 
FROM profiles 
ORDER BY role;

SELECT 
  '=== Family Summary ===' as info,
  family_id,
  COUNT(*) FILTER (WHERE role = 'parent') as parents,
  COUNT(*) FILTER (WHERE role = 'child') as children
FROM profiles
GROUP BY family_id;

-- Step 7: Make role column NOT NULL and add index
ALTER TABLE profiles 
ALTER COLUMN role SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_family_role ON profiles(family_id, role);

SELECT '✅ FIX COMPLETE' as status, 
       'Reminder feature should now work!' as message;
