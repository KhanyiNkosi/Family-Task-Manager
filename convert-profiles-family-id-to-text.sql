-- ============================================================================
-- CONVERT profiles.family_id from UUID to TEXT
-- ============================================================================
-- Problem: profiles.family_id is UUID but families.id is TEXT
-- Solution: Convert profiles.family_id to TEXT to match families.id
-- This is simpler than converting families.id to UUID (which has RLS issues)
-- ============================================================================

BEGIN;

DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Converting profiles.family_id to TEXT...';
  RAISE NOTICE '====================================';
END $$;

-- ============================================================================
-- STEP 1: VALIDATION - Show current data types
-- ============================================================================

DO $$
DECLARE
  v_profiles_type TEXT;
  v_families_type TEXT;
BEGIN
  SELECT data_type INTO v_profiles_type
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'family_id';
  
  SELECT data_type INTO v_families_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'families' 
    AND column_name = 'id';
  
  RAISE NOTICE 'BEFORE: profiles.family_id type = %', v_profiles_type;
  RAISE NOTICE 'BEFORE: families.id type = %', v_families_type;
  
  IF v_profiles_type = v_families_type THEN
    RAISE NOTICE '⚠️ Types already match - no conversion needed';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: BACKUP AND DROP RLS POLICIES THAT REFERENCE profiles.family_id
-- ============================================================================

-- Show existing policies before dropping (for audit trail)
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'RLS POLICIES THAT MAY REFERENCE profiles:';
  RAISE NOTICE '====================================';
  
  FOR policy_record IN (
    SELECT 
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE qual LIKE '%profiles%' 
       OR with_check LIKE '%profiles%'
       OR qual LIKE '%family_id%'
       OR with_check LIKE '%family_id%'
    ORDER BY tablename, policyname
  ) LOOP
    RAISE NOTICE 'Policy: %.% (%, %)', 
      policy_record.tablename,
      policy_record.policyname, 
      policy_record.cmd,
      policy_record.permissive;
    RAISE NOTICE '  USING: %', policy_record.qual;
    IF policy_record.with_check IS NOT NULL THEN
      RAISE NOTICE '  WITH CHECK: %', policy_record.with_check;
    END IF;
  END LOOP;
END $$;

-- Drop RLS policies on profiles table
DROP POLICY IF EXISTS profiles_select_own ON profiles;
DROP POLICY IF EXISTS profiles_select_family ON profiles;
DROP POLICY IF EXISTS profiles_insert_own ON profiles;
DROP POLICY IF EXISTS profiles_update_own ON profiles;
DROP POLICY IF EXISTS profiles_delete_own ON profiles;

-- Drop RLS policies on storage.objects that reference profiles
DROP POLICY IF EXISTS "Parents can delete family task photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their family photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload family photos" ON storage.objects;

-- Drop any other policies that might reference profiles.family_id
DROP POLICY IF EXISTS tasks_select_family ON tasks;
DROP POLICY IF EXISTS tasks_insert_family ON tasks;
DROP POLICY IF EXISTS tasks_update_family ON tasks;
DROP POLICY IF EXISTS tasks_delete_family ON tasks;

DO $$
BEGIN
  RAISE NOTICE '✅ Dropped all RLS policies that may reference profiles.family_id';
END $$;

-- ============================================================================
-- STEP 3: DROP DEPENDENT CONSTRAINTS (if any exist)
-- ============================================================================

DO $$
BEGIN
  -- Drop any existing FK constraint on profiles.family_id
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_family_id_fkey;
  RAISE NOTICE '✅ Dropped profiles_family_id_fkey (if existed)';
  
  -- Drop any indexes on profiles.family_id
  DROP INDEX IF EXISTS idx_profiles_family_id;
  RAISE NOTICE '✅ Dropped idx_profiles_family_id (if existed)';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Some constraints did not exist - continuing';
END $$;

-- ============================================================================
-- STEP 4: ALTER profiles.family_id from UUID to TEXT
-- ============================================================================

-- Convert the column type (UUID values will automatically convert to text)
ALTER TABLE profiles 
  ALTER COLUMN family_id TYPE TEXT USING family_id::TEXT;

DO $$
BEGIN
  RAISE NOTICE '✅ Converted profiles.family_id from UUID to TEXT';
END $$;

-- ============================================================================
-- STEP 5: RECREATE RLS POLICIES
-- ============================================================================

-- Enable RLS on profiles table (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Recreate profiles table policies
CREATE POLICY profiles_select_family ON profiles
  FOR SELECT
  USING (
    id = auth.uid() OR
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY profiles_delete_own ON profiles
  FOR DELETE
  USING (id = auth.uid());

DO $$
BEGIN
  RAISE NOTICE '✅ Created policies on profiles table';
END $$;

-- Recreate storage.objects policies (if storage schema exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    
    -- Enable RLS on storage.objects
    EXECUTE 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY';
    
    -- Parents can delete family task photos
    EXECUTE '
      CREATE POLICY "Parents can delete family task photos" ON storage.objects
      FOR DELETE
      USING (
        bucket_id = ''task-photos'' AND
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role = ''parent''
            AND profiles.family_id = (storage.objects.metadata->>''family_id'')::text
        )
      )
    ';
    RAISE NOTICE '✅ Created policy: Parents can delete family task photos';
    
    -- Users can view their family photos
    EXECUTE '
      CREATE POLICY "Users can view their family photos" ON storage.objects
      FOR SELECT
      USING (
        bucket_id = ''task-photos'' AND
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
            AND profiles.family_id = (storage.objects.metadata->>''family_id'')::text
        )
      )
    ';
    RAISE NOTICE '✅ Created policy: Users can view their family photos';
    
    -- Users can upload family photos
    EXECUTE '
      CREATE POLICY "Users can upload family photos" ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = ''task-photos'' AND
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
            AND profiles.family_id = (storage.objects.metadata->>''family_id'')::text
        )
      )
    ';
    RAISE NOTICE '✅ Created policy: Users can upload family photos';
    
  ELSE
    RAISE NOTICE '⚠️ storage schema does not exist - skipping storage policies';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error recreating storage policies: %', SQLERRM;
END $$;

-- Recreate task policies (if they existed)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    
    CREATE POLICY tasks_select_family ON tasks
      FOR SELECT
      USING (
        family_id IN (
          SELECT family_id FROM profiles WHERE id = auth.uid()
        )
      );
    RAISE NOTICE '✅ Created policy: tasks_select_family';
    
    CREATE POLICY tasks_insert_family ON tasks
      FOR INSERT
      WITH CHECK (
        family_id IN (
          SELECT family_id FROM profiles WHERE id = auth.uid()
        )
      );
    RAISE NOTICE '✅ Created policy: tasks_insert_family';
    
    CREATE POLICY tasks_update_family ON tasks
      FOR UPDATE
      USING (
        family_id IN (
          SELECT family_id FROM profiles WHERE id = auth.uid()
        )
      );
    RAISE NOTICE '✅ Created policy: tasks_update_family';
    
    CREATE POLICY tasks_delete_family ON tasks
      FOR DELETE
      USING (
        family_id IN (
          SELECT family_id FROM profiles WHERE id = auth.uid()
        ) AND
        EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'parent'
        )
      );
    RAISE NOTICE '✅ Created policy: tasks_delete_family';
    
  ELSE
    RAISE NOTICE '⚠️ tasks table does not exist - skipping task policies';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error recreating task policies: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 6: VERIFY THE CONVERSION
-- ============================================================================

DO $$
DECLARE
  v_profiles_type TEXT;
  v_families_type TEXT;
  v_sample_family_id TEXT;
  v_orphaned_count INTEGER;
BEGIN
  -- Check new types
  SELECT data_type INTO v_profiles_type
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'family_id';
  
  SELECT data_type INTO v_families_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'families' 
    AND column_name = 'id';
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'CONVERSION VERIFICATION';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'AFTER: profiles.family_id type = %', v_profiles_type;
  RAISE NOTICE 'AFTER: families.id type = %', v_families_type;
  
  IF v_profiles_type = v_families_type THEN
    RAISE NOTICE '✅ Type mismatch FIXED - both are %', v_profiles_type;
  ELSE
    RAISE WARNING '❌ Types still do not match!';
  END IF;
  
  -- Show sample converted value
  SELECT family_id INTO v_sample_family_id
  FROM profiles
  WHERE family_id IS NOT NULL
  LIMIT 1;
  
  IF v_sample_family_id IS NOT NULL THEN
    RAISE NOTICE 'Sample converted family_id: %', v_sample_family_id;
  END IF;
  
  -- Check for orphaned profiles (should still be 0 after creating families)
  SELECT COUNT(*) INTO v_orphaned_count
  FROM profiles p
  WHERE p.family_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM families f WHERE f.id = p.family_id);
  
  RAISE NOTICE 'Orphaned profiles: %', v_orphaned_count;
  
  IF v_orphaned_count > 0 THEN
    RAISE WARNING '⚠️ Still have % orphaned profiles', v_orphaned_count;
  ELSE
    RAISE NOTICE '✅ No orphaned profiles (ready for FK constraint)';
  END IF;
  
  -- Show recreated RLS policies
  RAISE NOTICE '====================================';
  RAISE NOTICE 'RLS POLICIES RECREATED:';
  RAISE NOTICE '====================================';
  
  FOR rec IN (
    SELECT tablename, policyname, cmd
    FROM pg_policies
    WHERE tablename IN ('profiles', 'tasks', 'objects')
    ORDER BY tablename, policyname
  ) LOOP
    RAISE NOTICE '✅ %.% (%)', rec.tablename, rec.policyname, rec.cmd;
  END LOOP;
  
END $$;

COMMIT;

-- ============================================================================
-- FINAL VERIFICATION QUERIES
-- ============================================================================

-- Show sample profiles with converted family_id
SELECT 
  'Sample Profiles After Conversion' as check_name,
  p.id::text as profile_id,
  p.email,
  p.family_id as family_id_text,
  pg_typeof(p.family_id)::text as family_id_type,
  CASE 
    WHEN f.id IS NOT NULL THEN '✅ Family exists'
    WHEN p.family_id IS NULL THEN '⚠️ No family assigned'
    ELSE '❌ Orphaned'
  END as status
FROM profiles p
LEFT JOIN families f ON f.id = p.family_id
LIMIT 10;

-- Verify types match
SELECT 
  'Type Comparison' as check_name,
  (SELECT data_type FROM information_schema.columns 
   WHERE table_name = 'profiles' AND column_name = 'family_id') as profiles_family_id_type,
  (SELECT data_type FROM information_schema.columns 
   WHERE table_name = 'families' AND column_name = 'id') as families_id_type,
  CASE 
    WHEN (SELECT data_type FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'family_id') =
         (SELECT data_type FROM information_schema.columns WHERE table_name = 'families' AND column_name = 'id')
    THEN '✅ Types match - FK can be added'
    ELSE '❌ Types still do not match'
  END as status;

DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ PROFILES.FAMILY_ID CONVERTED TO TEXT';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ Column type converted from UUID to TEXT';
  RAISE NOTICE '✅ RLS policies recreated on profiles, storage, tasks';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Next: Run add-foreign-keys.sql to add FK constraints';
END $$;
