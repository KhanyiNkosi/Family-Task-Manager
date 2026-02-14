-- ============================================================================
-- FULL VERIFICATION: All Migration Checks (Detailed Results)
-- ============================================================================
-- Run this to see complete results from all 8 checks
-- ============================================================================

\echo '===================================='
\echo 'CHECK 1: Column Data Types'
\echo '===================================='

SELECT 
  table_name,
  column_name,
  data_type,
  CASE 
    WHEN data_type = 'text' THEN '✅ TEXT'
    WHEN data_type = 'uuid' THEN '❌ UUID'
    ELSE '⚠️ ' || data_type
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    column_name LIKE '%family%'
    OR (table_name = 'families' AND column_name = 'id')
  )
ORDER BY 
  CASE WHEN data_type != 'text' THEN 1 ELSE 2 END,
  table_name,
  column_name;

\echo ''
\echo '===================================='
\echo 'CHECK 2: Orphaned Profiles'
\echo '===================================='

SELECT 
  COUNT(*) as orphaned_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ NO ORPHANS'
    ELSE '❌ ' || COUNT(*) || ' ORPHANS FOUND'
  END as status
FROM profiles p
WHERE p.family_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM families f WHERE f.id = p.family_id);

-- List any orphans (if found)
SELECT 
  p.id,
  p.family_id,
  p.role,
  p.email,
  '❌ No matching family' as issue
FROM profiles p
WHERE p.family_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM families f WHERE f.id = p.family_id)
LIMIT 10;

\echo ''
\echo '===================================='
\echo 'CHECK 3: Foreign Key Constraints'
\echo '===================================='

SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column,
  tc.constraint_name,
  '✅ EXISTS' as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND kcu.column_name LIKE '%family%'
ORDER BY tc.table_name;

-- Check if we have ZERO FKs (expected if not yet added)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '⚠️ No FK constraints yet (run add-foreign-keys.sql)'
    ELSE '✅ ' || COUNT(*) || ' FK constraints exist'
  END as fk_status
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
  AND table_schema = 'public'
  AND constraint_name LIKE '%family%';

\echo ''
\echo '===================================='
\echo 'CHECK 4: RLS Policies by Table'
\echo '===================================='

SELECT 
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PROTECTED'
    ELSE '⚠️ NO POLICIES'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name LIKE '%family%'
  )
GROUP BY tablename
ORDER BY tablename;

\echo ''
\echo '===================================='
\echo 'CHECK 5: Profiles Policy Detail'
\echo '===================================='

SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%get_user_family%' OR with_check LIKE '%get_user_family%' THEN 
      CASE 
        WHEN qual LIKE '%get_user_family_text%' OR with_check LIKE '%get_user_family_text%' THEN '✅ Uses TEXT function'
        ELSE '⚠️ May use UUID function'
      END
    ELSE '✅ No get_user_family calls'
  END as function_usage
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;

\echo ''
\echo '===================================='
\echo 'CHECK 6: Performance Indexes'
\echo '===================================='

SELECT 
  tablename,
  indexname,
  CASE 
    WHEN indexdef LIKE '%family_id%' THEN '✅ family_id index'
    ELSE '⚠️ other family column'
  END as index_type
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%family%'
ORDER BY tablename, indexname;

\echo ''
\echo '===================================='
\echo 'CHECK 7: Known User Data Integrity'
\echo '===================================='

SELECT 
  p.id,
  p.family_id,
  p.role,
  p.email,
  CASE 
    WHEN f.id IS NOT NULL THEN '✅ Family exists'
    ELSE '❌ Family missing'
  END as family_status,
  CASE 
    WHEN p.family_id = f.id THEN '✅ IDs match'
    WHEN f.id IS NULL THEN '❌ No family'
    ELSE '❌ Mismatch'
  END as id_match
FROM profiles p
LEFT JOIN families f ON p.family_id = f.id
WHERE p.family_id = '32af85db-12f6-4d60-9995-f585aa973ba3'
ORDER BY p.role DESC, p.email;

\echo ''
\echo '===================================='
\echo 'CHECK 8: Function Return Types'
\echo '===================================='

SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  CASE 
    WHEN pg_get_function_result(p.oid) LIKE '%uuid%' THEN '⚠️ Returns UUID'
    WHEN pg_get_function_result(p.oid) LIKE '%text%' THEN '✅ Returns TEXT'
    ELSE '? ' || pg_get_function_result(p.oid)
  END as compatibility
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname ILIKE '%family%'
ORDER BY 
  CASE WHEN pg_get_function_result(p.oid) LIKE '%uuid%' THEN 1 ELSE 2 END,
  p.proname;

\echo ''
\echo '===================================='
\echo 'SUMMARY COUNTS'
\echo '===================================='

SELECT 
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'public' AND column_name LIKE '%family%' AND data_type = 'uuid') as uuid_columns_remaining,
  (SELECT COUNT(*) FROM profiles p WHERE p.family_id IS NOT NULL 
   AND NOT EXISTS (SELECT 1 FROM families f WHERE f.id = p.family_id)) as orphaned_profiles,
  (SELECT COUNT(*) FROM information_schema.table_constraints 
   WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public' 
   AND constraint_name LIKE '%family%') as fk_constraints,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') as profiles_policies,
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
   WHERE n.nspname = 'public' AND p.proname ILIKE '%family%' 
   AND pg_get_function_result(p.oid) LIKE '%uuid%') as uuid_returning_functions;

\echo ''
\echo '===================================='
\echo 'MIGRATION STATUS'
\echo '===================================='
\echo 'Review results above.'
\echo ''
\echo 'Expected state after full migration:'
\echo '  - uuid_columns_remaining: 0'
\echo '  - orphaned_profiles: 0'
\echo '  - fk_constraints: 2+ (or 0 if not added yet)'
\echo '  - profiles_policies: 1+'
\echo '  - uuid_returning_functions: 0'
