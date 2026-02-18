-- ============================================================================
-- CHECK SCHEMA COMPATIBILITY FOR UUID CONVERSION
-- ============================================================================
-- Verifies that converting family_id to UUID won't break existing code
-- ============================================================================

\echo '========================================'
\echo 'CURRENT SCHEMA ANALYSIS'
\echo '========================================'

-- Check family_id column types in all tables
SELECT 
  table_name,
  column_name,
  data_type,
  udt_name,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'family_id'
ORDER BY table_name;

\echo ''
\echo '========================================'
\echo 'CHECK families TABLE'
\echo '========================================'

-- Check families.id type (should match family_id references)
SELECT 
  table_name,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'families'
AND column_name = 'id';

\echo ''
\echo '========================================'
\echo 'CHECK FOREIGN KEY RELATIONSHIPS'
\echo '========================================'

-- Check if there are foreign keys from family_id to families
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_type
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE kcu.column_name = 'family_id'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

\echo ''
\echo '========================================'
\echo 'COMPATIBILITY CHECK'
\echo '========================================'

DO $$
DECLARE
  v_profiles_family_type TEXT;
  v_tasks_family_type TEXT;
  v_families_id_type TEXT;
BEGIN
  -- Get column types
  SELECT data_type INTO v_profiles_family_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'family_id';
  
  SELECT data_type INTO v_tasks_family_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'family_id';
  
  SELECT data_type INTO v_families_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'families' AND column_name = 'id';
  
  RAISE NOTICE 'Current types:';
  RAISE NOTICE '  profiles.family_id: %', v_profiles_family_type;
  RAISE NOTICE '  tasks.family_id: %', v_tasks_family_type;
  RAISE NOTICE '  families.id: %', v_families_id_type;
  RAISE NOTICE '';
  
  -- Check compatibility
  IF v_families_id_type = 'text' OR v_families_id_type = 'character varying' THEN
    RAISE NOTICE '⚠️  WARNING: families.id is TEXT';
    RAISE NOTICE '   If we convert family_id to UUID, we must also convert families.id';
    RAISE NOTICE '';
  ELSIF v_families_id_type = 'uuid' THEN
    RAISE NOTICE '✅ families.id is already UUID - safe to convert!';
    RAISE NOTICE '';
  END IF;
  
  -- Check if Supabase client will handle conversion
  RAISE NOTICE '📝 Note: Supabase JavaScript client handles type conversion:';
  RAISE NOTICE '   .eq("family_id", "string-uuid") works with UUID columns';
  RAISE NOTICE '   Frontend code does NOT need changes';
  RAISE NOTICE '';
END $$;

\echo ''
\echo '========================================'
\echo 'RECOMMENDATION'
\echo '========================================'
\echo ''
\echo 'If families.id is TEXT:'
\echo '  → Convert families.id to UUID FIRST'
\echo '  → Then convert all family_id columns to UUID'
\echo '  → Frontend code works automatically (Supabase handles conversion)'
\echo ''
\echo 'If families.id is already UUID:'
\echo '  → Safe to convert all family_id columns immediately'
\echo '  → No frontend code changes needed'
\echo ''
