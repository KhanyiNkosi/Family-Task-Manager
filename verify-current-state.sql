-- ============================================================================
-- VERIFICATION: Check current database state after partial migration
-- ============================================================================
-- Run this to see what completed and what still needs fixing
-- ============================================================================

-- Check 1: What columns exist in families table?
SELECT 
  'families table columns' as check_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'families'
ORDER BY ordinal_position;

-- Check 2: Verify families.id type (should be UUID now)
SELECT 
  'families.id type' as check_name,
  data_type as current_type,
  CASE 
    WHEN data_type = 'uuid' THEN '✅ Conversion succeeded'
    WHEN data_type = 'text' THEN '❌ Still TEXT - conversion failed'
    ELSE '⚠️ Unexpected type'
  END as status
FROM information_schema.columns
WHERE table_name = 'families' AND column_name = 'id';

-- Check 3: Verify profiles.family_id type
SELECT 
  'profiles.family_id type' as check_name,
  data_type as current_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'family_id';

-- Check 4: Check for any data in families table
SELECT 
  'families table data' as check_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT id) as unique_ids
FROM families;

-- Check 5: Foreign key constraints status
SELECT 
  'Foreign Key Constraints' as check_name,
  tc.constraint_name,
  kcu.table_name,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'families';

-- Check 6: RLS policies on families table
SELECT 
  'RLS Policies on families' as check_name,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'families'
ORDER BY policyname;

-- Check 7: Check for orphaned profiles
SELECT 
  'Orphaned profiles check' as check_name,
  COUNT(*) as orphaned_count,
  STRING_AGG(p.id::text, ', ') as sample_orphaned_ids
FROM profiles p
LEFT JOIN families f ON p.family_id = f.id
WHERE p.family_id IS NOT NULL AND f.id IS NULL;

-- Check 8: Check for orphaned activity_feed
SELECT 
  'Orphaned activity_feed check' as check_name,
  COUNT(*) as orphaned_count
FROM activity_feed af
LEFT JOIN families f ON af.family_id = f.id
WHERE af.family_id IS NOT NULL AND f.id IS NULL;

-- Check 9: Sample profiles with family_id
SELECT 
  'Sample profiles' as check_name,
  p.id,
  p.email,
  p.role,
  p.family_id,
  CASE 
    WHEN f.id IS NOT NULL THEN '✅ Family exists'
    WHEN p.family_id IS NULL THEN '⚠️ No family assigned'
    ELSE '❌ Orphaned - family missing'
  END as family_status
FROM profiles p
LEFT JOIN families f ON p.family_id = f.id
LIMIT 10;

-- Check 10: RLS enabled on families?
SELECT 
  'RLS Status' as check_name,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'families';
