-- ============================================================================
-- DIAGNOSTIC: Find all dependencies blocking user deletion
-- ============================================================================
-- Finds all foreign keys and rows referencing the user/family
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID := 'bd1bb7db-f19b-4d16-b61f-42632d414f2e';
  v_family_id TEXT := '3c2388ee-148a-4b3c-9a2e-f56236826946';
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'FINDING DEPENDENCIES BLOCKING DELETION';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
END $$;

-- Check 1: All foreign key constraints in public schema
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND (
    ccu.table_name IN ('profiles', 'families', 'auth.users')
    OR tc.table_name IN ('profiles', 'families')
  )
ORDER BY tc.table_name, tc.constraint_name;

-- Check 2: Find ALL rows in public schema referencing this user_id
DO $$
DECLARE
  v_user_id UUID := 'bd1bb7db-f19b-4d16-b61f-42632d414f2e';
  v_table_name TEXT;
  v_column_name TEXT;
  v_count INTEGER;
  v_total_refs INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'SCANNING FOR USER_ID REFERENCES';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  
  -- Loop through all columns named with user, created_by, owner, assigned, etc
  FOR v_table_name, v_column_name IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND data_type = 'uuid'
      AND (
        column_name ILIKE '%user%'
        OR column_name ILIKE '%owner%'
        OR column_name ILIKE '%created_by%'
        OR column_name ILIKE '%assigned%'
        OR column_name ILIKE '%parent%'
      )
    ORDER BY table_name, column_name
  LOOP
    BEGIN
      EXECUTE format('SELECT COUNT(*) FROM %I WHERE %I = $1', v_table_name, v_column_name)
      INTO v_count
      USING v_user_id;
      
      IF v_count > 0 THEN
        RAISE NOTICE '⚠️  %.%: % row(s)', v_table_name, v_column_name, v_count;
        v_total_refs := v_total_refs + v_count;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Skip tables we can't query
      NULL;
    END;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Total references to user_id: %', v_total_refs;
END $$;

-- Check 3: Find ALL rows in public schema referencing this family_id
DO $$
DECLARE
  v_family_id_uuid UUID := '3c2388ee-148a-4b3c-9a2e-f56236826946';
  v_family_id_text TEXT := '3c2388ee-148a-4b3c-9a2e-f56236826946';
  v_table_name TEXT;
  v_column_name TEXT;
  v_data_type TEXT;
  v_count INTEGER;
  v_total_refs INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'SCANNING FOR FAMILY_ID REFERENCES';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  
  -- Loop through all columns named family_id
  FOR v_table_name, v_column_name, v_data_type IN
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name ILIKE '%family%'
    ORDER BY table_name, column_name
  LOOP
    BEGIN
      IF v_data_type IN ('uuid', 'character varying', 'text') THEN
        IF v_data_type = 'uuid' THEN
          EXECUTE format('SELECT COUNT(*) FROM %I WHERE %I = $1', v_table_name, v_column_name)
          INTO v_count
          USING v_family_id_uuid;
        ELSE
          EXECUTE format('SELECT COUNT(*) FROM %I WHERE %I = $1', v_table_name, v_column_name)
          INTO v_count
          USING v_family_id_text;
        END IF;
        
        IF v_count > 0 THEN
          RAISE NOTICE '⚠️  %.% (%): % row(s)', v_table_name, v_column_name, v_data_type, v_count;
          v_total_refs := v_total_refs + v_count;
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Skip tables we can't query
      NULL;
    END;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Total references to family_id: %', v_total_refs;
END $$;

-- Check 4: Specific critical tables (manual check)
SELECT 'profiles' as table_name, COUNT(*) as count
FROM profiles WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e'
UNION ALL
SELECT 'user_profiles', COUNT(*)
FROM user_profiles WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e'
UNION ALL
SELECT 'families', COUNT(*)
FROM families WHERE id = '3c2388ee-148a-4b3c-9a2e-f56236826946'
UNION ALL
SELECT 'families (owner)', COUNT(*)
FROM families WHERE owner_id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e'
UNION ALL
SELECT 'tasks', COUNT(*)
FROM tasks WHERE family_id::text = '3c2388ee-148a-4b3c-9a2e-f56236826946'
UNION ALL
SELECT 'notifications', COUNT(*)
FROM notifications WHERE user_id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e';

-- Check 5: Auth schema dependencies (if accessible)
SELECT 
  'auth.users' as table_name,
  id,
  email,
  created_at,
  '⚠️ This is the auth record that needs to be deleted last' as note
FROM auth.users 
WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e';

-- Check 6: RLS policies that might block deletion
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE (tablename IN ('profiles', 'families', 'tasks', 'notifications', 'user_profiles')
   OR tablename = 'users')
  AND cmd IN ('DELETE', 'ALL')
ORDER BY schemaname, tablename, policyname;
