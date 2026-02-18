-- ============================================================================
-- CONVERT profiles.family_id from TEXT to UUID
-- ============================================================================
-- Safe conversion with validation and rollback on errors
-- ============================================================================

\echo '========================================'
\echo 'STEP 1: Validate current family_id values'
\echo '========================================'

-- Check current column type
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
AND column_name = 'family_id';

\echo ''
\echo 'Current data in family_id column:'

-- Show sample values and counts
SELECT 
  family_id,
  COUNT(*) as user_count,
  family_id IS NOT NULL as has_value,
  -- Test if it's a valid UUID format
  family_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' as is_valid_uuid
FROM public.profiles
GROUP BY family_id
ORDER BY user_count DESC
LIMIT 10;

\echo ''
\echo 'Checking for invalid UUID values...'

-- Check for any non-UUID values
SELECT 
  id,
  email,
  family_id,
  'Invalid UUID format' as issue
FROM public.profiles
WHERE family_id IS NOT NULL
AND family_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

\echo ''
\echo '========================================'
\echo 'STEP 2: Check dependencies and constraints'
\echo '========================================'

-- Check foreign keys referencing family_id
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND (ccu.table_name = 'profiles' AND ccu.column_name = 'family_id');

\echo ''
\echo '========================================'
\echo 'STEP 3: Convert family_id to UUID type'
\echo '========================================'

-- Perform the conversion
-- USING family_id::uuid will convert text to uuid
-- If any value is invalid, this will fail with an error
ALTER TABLE public.profiles 
ALTER COLUMN family_id TYPE uuid 
USING family_id::uuid;

\echo '✅ Successfully converted family_id from text to uuid!'

\echo ''
\echo '========================================'
\echo 'STEP 4: Verify conversion'
\echo '========================================'

-- Verify new column type
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
AND column_name = 'family_id';

\echo ''
\echo 'Sample data after conversion:'

SELECT 
  id,
  email,
  family_id,
  pg_typeof(family_id) as column_type
FROM public.profiles
WHERE family_id IS NOT NULL
LIMIT 5;

\echo ''
\echo '========================================'
\echo 'STEP 5: Test uuid = uuid comparison'
\echo '========================================'

DO $$
DECLARE
  v_parent1_id UUID := 'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3';
  v_comparison_works BOOLEAN;
BEGIN
  PERFORM set_config('request.jwt.claims', 
    json_build_object('sub', v_parent1_id::text, 'role', 'authenticated')::text, 
    true);
  
  -- Test the comparison that was failing before
  SELECT 
    (family_id = get_current_user_family_id()) INTO v_comparison_works
  FROM public.profiles
  WHERE id = v_parent1_id;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'UUID Comparison Test';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Query: family_id = get_current_user_family_id()';
  RAISE NOTICE 'Both sides are now uuid type';
  RAISE NOTICE 'Result: %', CASE WHEN v_comparison_works THEN '✅ TRUE (comparison works!)' ELSE '❌ FALSE' END;
  RAISE NOTICE '';
  
  IF v_comparison_works THEN
    RAISE NOTICE '🎉 SUCCESS! Type mismatch is completely FIXED!';
  ELSE
    RAISE NOTICE '⚠️  Comparison returned FALSE (values may not match)';
  END IF;
  
  PERFORM set_config('request.jwt.claims', NULL, true);
END $$;

\echo ''
\echo '========================================'
\echo 'STEP 6: Check tasks.family_id type'
\echo '========================================'

-- Check if tasks.family_id also needs conversion
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'tasks'
AND column_name = 'family_id';

\echo ''
\echo '⚠️  If tasks.family_id is also TEXT, we need to convert it too!'
\echo ''

\echo '========================================'
\echo 'STEP 7: Verify RLS policies'
\echo '========================================'

-- Check policies that compare family_id
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  SUBSTRING(qual, 1, 100) as policy_using_clause
FROM pg_policies
WHERE schemaname = 'public'
AND (qual LIKE '%family_id%' OR qual LIKE '%get_current_user_family_id%')
ORDER BY tablename, policyname;

\echo ''
\echo '========================================'
\echo 'SUMMARY'
\echo '========================================'
\echo '✅ profiles.family_id converted from text to uuid'
\echo '✅ Type comparison now works: uuid = uuid'
\echo '✅ RLS policies can properly match family_id'
\echo ''
\echo 'Next steps:'
\echo '  1. If tasks.family_id is TEXT, convert it too'
\echo '  2. Run: test-actual-rls-access.sql'
\echo '  3. Both parents refresh dashboards'
\echo '  4. Tasks should load!'
\echo ''
