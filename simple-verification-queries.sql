-- ============================================================================
-- SIMPLE VERIFICATION - Run queries one at a time
-- ============================================================================
-- Copy and run each query separately to see results in Supabase UI
-- ============================================================================

-- QUERY 1: Check trigger function exists
-- Expected: 1 row with handle_new_user
SELECT 
  p.proname as function_name,
  '✅ Trigger function exists' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'handle_new_user';

-- ============================================================================

-- QUERY 2: Check trigger is active
-- Expected: 1 row showing trigger enabled
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as on_table,
  CASE 
    WHEN tgenabled = 'O' THEN '✅ Enabled'
    ELSE '❌ Not enabled'
  END as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- ============================================================================

-- QUERY 3: Check for orphaned profiles
-- Expected: 0 orphaned_count
SELECT 
  COUNT(*) as orphaned_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No orphans'
    ELSE '❌ Orphans found'
  END as status
FROM profiles p
WHERE p.family_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM families f WHERE f.id = p.family_id);

-- ============================================================================

-- QUERY 4: Check families have owners
-- Expected: All 6 families should have owner_id (after running fix-missing-owner-ids.sql)
SELECT 
  COUNT(*) as total_families,
  COUNT(owner_id) as with_owner,
  COUNT(*) - COUNT(owner_id) as without_owner,
  CASE 
    WHEN COUNT(*) = COUNT(owner_id) THEN '✅ All have owners'
    ELSE '⚠️ Some missing owners'
  END as status
FROM families;

-- ============================================================================

-- QUERY 5: Show all families with member counts
-- Expected: See your 6 families with 1-3 members each
SELECT 
  SUBSTRING(f.id FROM 1 FOR 13) || '...' as family_id,
  SUBSTRING(f.owner_id::text FROM 1 FOR 13) || '...' as owner_id,
  p.email as owner_email,
  (SELECT COUNT(*) FROM profiles WHERE family_id = f.id) as members,
  CASE 
    WHEN f.owner_id IS NOT NULL THEN '✅ Has owner'
    ELSE '⚠️ No owner'
  END as status
FROM families f
LEFT JOIN profiles p ON f.owner_id = p.id
ORDER BY f.created_at DESC;

-- ============================================================================

-- QUERY 6: Show recent user registrations
-- Expected: All users should have "✅ Family exists"
SELECT 
  p.email,
  p.role,
  p.created_at::date as joined,
  CASE 
    WHEN f.id IS NOT NULL THEN '✅ Family exists'
    WHEN p.family_id IS NULL THEN '⚠️ No family'
    ELSE '❌ Orphaned'
  END as family_status
FROM profiles p
LEFT JOIN families f ON p.family_id = f.id
ORDER BY p.created_at DESC
LIMIT 10;

-- ============================================================================

-- QUERY 7: Check FK constraints are active
-- Expected: 3+ rows showing FK constraints on family_id columns
SELECT 
  tc.table_name,
  kcu.column_name,
  'families' as references_table,
  tc.constraint_name,
  '✅ FK active' as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND kcu.column_name = 'family_id'
ORDER BY tc.table_name;

-- ============================================================================

-- QUERY 8: Final migration status
-- Expected: All 0 except fk_constraints should be 3+
SELECT 
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'public' AND column_name LIKE '%family%' 
   AND data_type = 'uuid') as uuid_columns_remaining,
  (SELECT COUNT(*) FROM profiles p WHERE p.family_id IS NOT NULL 
   AND NOT EXISTS (SELECT 1 FROM families f WHERE f.id = p.family_id)) as orphaned_profiles,
  (SELECT COUNT(*) FROM information_schema.table_constraints 
   WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public' 
   AND constraint_name LIKE '%family%') as fk_constraints,
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
   WHERE n.nspname = 'public' AND p.proname ILIKE '%family%' 
   AND pg_get_function_result(p.oid) LIKE '%uuid%') as uuid_returning_functions,
  (SELECT COUNT(*) - COUNT(owner_id) FROM families) as families_without_owner;

-- ============================================================================
-- EXPECTED FINAL STATE:
-- uuid_columns_remaining: 0
-- orphaned_profiles: 0
-- fk_constraints: 3+ 
-- uuid_returning_functions: 0
-- families_without_owner: 0
-- ============================================================================
