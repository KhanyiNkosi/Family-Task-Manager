-- =============================================================================
-- FIX FAMILY CONNECTION FOR REMINDER FEATURE
-- =============================================================================
-- Run this in your Supabase SQL Editor to fix the "No parent found" error
-- =============================================================================

-- Step 1: Check current state
SELECT 
  '=== Current Profiles ===' as step,
  NULL as role,
  NULL as full_name, 
  NULL as family_id;

SELECT 
  '1. Current State' as step,
  role,
  full_name,
  family_id
FROM profiles
ORDER BY role;

-- Step 2: Find the problem (different family_ids)
SELECT 
  '=== Problem Check ===' as step,
  NULL as description,
  NULL as count;

SELECT 
  '2. Unique Family IDs' as step,
  'Each user should share the same family_id' as description,
  COUNT(DISTINCT family_id) as count
FROM profiles;

-- Step 3: Fix it - Set all children to use parent's family_id
UPDATE profiles
SET family_id = (
  SELECT family_id 
  FROM profiles 
  WHERE role = 'parent' 
  LIMIT 1
)
WHERE role = 'child';

-- Step 4: Verify the fix
SELECT 
  '=== After Fix ===' as step,
  NULL as role,
  NULL as full_name,
  NULL as family_id;

SELECT 
  '3. Fixed State' as step,
  role,
  full_name,
  family_id
FROM profiles
ORDER BY role;

-- Step 5: Confirm all have same family_id
SELECT 
  '=== Verification ===' as step,
  NULL as message;

SELECT 
  '4. Family ID Count' as step,
  CASE 
    WHEN COUNT(DISTINCT family_id) = 1 THEN '✅ SUCCESS: All family members have same family_id'
    ELSE '❌ PROBLEM: Still have different family_ids'
  END as message
FROM profiles;

SELECT 
  '5. Family Summary' as step,
  family_id,
  COUNT(*) FILTER (WHERE role = 'parent') as parents,
  COUNT(*) FILTER (WHERE role = 'child') as children
FROM profiles
GROUP BY family_id;
