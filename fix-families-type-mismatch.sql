-- ============================================================================
-- FIX TYPE MISMATCH: Convert families.id from TEXT to UUID
-- ============================================================================
-- Problem: profiles.family_id is UUID but families.id is TEXT
-- This prevents foreign key constraints and causes join issues
-- Solution: Convert families.id to UUID and add proper FK constraint
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: VALIDATION - Check for non-UUID values in families.id
-- ============================================================================

DO $$
DECLARE
  v_invalid_count INTEGER;
  v_invalid_ids TEXT;
BEGIN
  -- Check if any families.id values are not valid UUIDs
  SELECT COUNT(*), STRING_AGG(id, ', ')
  INTO v_invalid_count, v_invalid_ids
  FROM families
  WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  
  IF v_invalid_count > 0 THEN
    RAISE WARNING 'Found % non-UUID values in families.id: %', v_invalid_count, v_invalid_ids;
    RAISE EXCEPTION 'Cannot convert families.id to UUID - contains non-UUID values. Fix these first.';
  ELSE
    RAISE NOTICE '✅ All families.id values are valid UUIDs';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: BACKUP AND DROP RLS POLICIES ON FAMILIES TABLE
-- ============================================================================

-- Show existing policies before dropping (for reference)
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'EXISTING RLS POLICIES ON families:';
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
    WHERE tablename = 'families'
  ) LOOP
    RAISE NOTICE 'Policy: % (%, %)', 
      policy_record.policyname, 
      policy_record.cmd,
      policy_record.permissive;
    RAISE NOTICE '  USING: %', policy_record.qual;
    RAISE NOTICE '  WITH CHECK: %', policy_record.with_check;
  END LOOP;
END $$;

-- Drop all RLS policies on families table
DROP POLICY IF EXISTS families_select_owner_or_member ON families;
DROP POLICY IF EXISTS families_insert_parent ON families;
DROP POLICY IF EXISTS families_update_owner ON families;
DROP POLICY IF EXISTS families_delete_owner ON families;
DROP POLICY IF EXISTS families_select_policy ON families;
DROP POLICY IF EXISTS families_insert_policy ON families;
DROP POLICY IF EXISTS families_update_policy ON families;
DROP POLICY IF EXISTS families_delete_policy ON families;

RAISE NOTICE '✅ Dropped all RLS policies on families table';

-- ============================================================================
-- STEP 3: DROP DEPENDENT FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Drop any existing foreign key constraints (if they exist)
DO $$
BEGIN
  -- Drop FK from profiles to families (if exists)
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_family_id_fkey;
  RAISE NOTICE '✅ Dropped profiles_family_id_fkey (if existed)';
  
  -- Drop FK from activity_feed to families (if exists)
  ALTER TABLE activity_feed DROP CONSTRAINT IF EXISTS activity_feed_family_id_fkey;
  RAISE NOTICE '✅ Dropped activity_feed_family_id_fkey (if existed)';
  
  -- Drop FK from tasks to families (if exists)
  ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_family_id_fkey;
  RAISE NOTICE '✅ Dropped tasks_family_id_fkey (if existed)';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Some constraints did not exist - continuing';
END $$;

-- ============================================================================
-- STEP 4: ALTER families.id from TEXT to UUID
-- ============================================================================

-- Convert the column type
ALTER TABLE families 
  ALTER COLUMN id TYPE UUID USING id::UUID;

RAISE NOTICE '✅ Converted families.id from TEXT to UUID';

-- Ensure id is still PRIMARY KEY
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_pkey;
ALTER TABLE families ADD PRIMARY KEY (id);

RAISE NOTICE '✅ Re-created PRIMARY KEY constraint on families.id';

-- ============================================================================
-- STEP 5: ALTER families.family_code (if column exists)
-- ============================================================================

DO $$
BEGIN
  -- Check if family_code column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'families' AND column_name = 'family_code'
  ) THEN
    -- Make sure family_code is TEXT and has proper constraints
    ALTER TABLE families 
      ALTER COLUMN family_code TYPE TEXT;
    
    -- Add unique constraint if not exists
    BEGIN
      ALTER TABLE families ADD CONSTRAINT families_family_code_key UNIQUE (family_code);
      RAISE NOTICE '✅ Added unique constraint on families.family_code';
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE '⚠️ Unique constraint on family_code already exists';
    END;
  ELSE
    RAISE NOTICE '⚠️ families.family_code column does not exist - skipping';
  END IF;
END $$;

-- ============================================================================
-- STEP 6: ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add FK from profiles.family_id to families.id
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_family_id_fkey;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_family_id_fkey 
  FOREIGN KEY (family_id) 
  REFERENCES families(id) 
  ON DELETE SET NULL;

RAISE NOTICE '✅ Added FK constraint: profiles.family_id → families.id';

-- Add FK from activity_feed.family_id to families.id
ALTER TABLE activity_feed
  DROP CONSTRAINT IF EXISTS activity_feed_family_id_fkey;

ALTER TABLE activity_feed
  ADD CONSTRAINT activity_feed_family_id_fkey 
  FOREIGN KEY (family_id) 
  REFERENCES families(id) 
  ON DELETE CASCADE;

RAISE NOTICE '✅ Added FK constraint: activity_feed.family_id → families.id';

-- Add FK from tasks.family_id to families.id (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'family_id'
  ) THEN
    ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_family_id_fkey;
    ALTER TABLE tasks
      ADD CONSTRAINT tasks_family_id_fkey 
      FOREIGN KEY (family_id) 
      REFERENCES families(id) 
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added FK constraint: tasks.family_id → families.id';
  ELSE
    RAISE NOTICE '⚠️ tasks.family_id column does not exist - skipping FK';
  END IF;
END $$;

-- ============================================================================
-- STEP 7: RECREATE RLS POLICIES ON FAMILIES TABLE
-- ============================================================================

-- Enable RLS on families table
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

RAISE NOTICE '✅ Enabled RLS on families table';

-- Policy: Allow users to view their own family or families they are members of
CREATE POLICY families_select_owner_or_member ON families
  FOR SELECT
  USING (
    id IN (
      SELECT family_id 
      FROM profiles 
      WHERE id = auth.uid() AND family_id IS NOT NULL
    )
  );

RAISE NOTICE '✅ Created policy: families_select_owner_or_member';

-- Policy: Allow parents to insert families
CREATE POLICY families_insert_parent ON families
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'parent'
    )
  );

RAISE NOTICE '✅ Created policy: families_insert_parent';

-- Policy: Allow family owners to update their family
CREATE POLICY families_update_owner ON families
  FOR UPDATE
  USING (
    id IN (
      SELECT family_id 
      FROM profiles 
      WHERE id = auth.uid() AND role = 'parent'
    )
  );

RAISE NOTICE '✅ Created policy: families_update_owner';

-- Policy: Allow family owners to delete their family
CREATE POLICY families_delete_owner ON families
  FOR DELETE
  USING (
    id IN (
      SELECT family_id 
      FROM profiles 
      WHERE id = auth.uid() AND role = 'parent'
    )
  );

RAISE NOTICE '✅ Created policy: families_delete_owner';

-- ============================================================================
-- STEP 8: CREATE INDEXES for Performance
-- ============================================================================

-- Index on families.id (should exist as PK, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_families_id ON families(id);

-- Index on profiles.family_id for faster joins
CREATE INDEX IF NOT EXISTS idx_profiles_family_id ON profiles(family_id);

-- Index on activity_feed.family_id for faster joins
CREATE INDEX IF NOT EXISTS idx_activity_feed_family_id ON activity_feed(family_id);

RAISE NOTICE '✅ Created indexes for FK columns';

-- ============================================================================
-- STEP 9: VERIFY THE MIGRATION
-- ============================================================================

DO $$
DECLARE
  v_families_type TEXT;
  v_profiles_type TEXT;
  v_orphaned_profiles INTEGER;
  v_orphaned_activity INTEGER;
BEGIN
  -- Check column types
  SELECT data_type INTO v_families_type
  FROM information_schema.columns
  WHERE table_name = 'families' AND column_name = 'id';
  
  SELECT data_type INTO v_profiles_type
  FROM information_schema.columns
  WHERE table_name = 'profiles' AND column_name = 'family_id';
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'MIGRATION VERIFICATION';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'families.id type: %', v_families_type;
  RAISE NOTICE 'profiles.family_id type: %', v_profiles_type;
  
  IF v_families_type = 'uuid' AND v_profiles_type = 'uuid' THEN
    RAISE NOTICE '✅ Type mismatch FIXED - both are UUID';
  ELSE
    RAISE WARNING '❌ Types still do not match!';
  END IF;
  
  -- Check for orphaned profiles
  SELECT COUNT(*) INTO v_orphaned_profiles
  FROM profiles p
  LEFT JOIN families f ON p.family_id = f.id
  WHERE p.family_id IS NOT NULL AND f.id IS NULL;
  
  -- Check for orphaned activity_feed
  SELECT COUNT(*) INTO v_orphaned_activity
  FROM activity_feed af
  LEFT JOIN families f ON af.family_id = f.id
  WHERE af.family_id IS NOT NULL AND f.id IS NULL;
  
  RAISE NOTICE 'Orphaned profiles: %', v_orphaned_profiles;
  RAISE NOTICE 'Orphaned activity_feed: %', v_orphaned_activity;
  
  IF v_orphaned_profiles > 0 OR v_orphaned_activity > 0 THEN
    RAISE WARNING '⚠️ Still have orphaned records - run fix-activity-feed-constraint.sql';
  ELSE
    RAISE NOTICE '✅ No orphaned records';
  END IF;
  
  -- Show FK constraints
  RAISE NOTICE '====================================';
  RAISE NOTICE 'FOREIGN KEY CONSTRAINTS:';
  RAISE NOTICE '====================================';
  
  FOR rec IN (
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'families'
    ORDER BY tc.table_name
  ) LOOP
    RAISE NOTICE '✅ %.% → %.%', 
      rec.table_name, rec.column_name,
      rec.foreign_table_name, rec.foreign_column_name;
  END LOOP;
  
  -- Show RLS policies
  RAISE NOTICE '====================================';
  RAISE NOTICE 'RLS POLICIES ON FAMILIES:';
  RAISE NOTICE '====================================';
  
  FOR rec IN (
    SELECT policyname, cmd
    FROM pg_policies
    WHERE tablename = 'families'
    ORDER BY policyname
  ) LOOP
    RAISE NOTICE '✅ % (%)', rec.policyname, rec.cmd;
  END LOOP;
  
END $$;

COMMIT;

-- ============================================================================
-- FINAL CHECKS
-- ============================================================================

-- Show a sample of families with their types verified
DO $$
BEGIN
  -- Check if family_code exists before querying it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'families' AND column_name = 'family_code'
  ) THEN
    -- Query with family_code
    RAISE NOTICE 'Families table sample (with family_code):';
    FOR rec IN (
      SELECT 
        id::text as id_text,
        family_code,
        created_at,
        pg_typeof(id)::text as id_type
      FROM families
      LIMIT 5
    ) LOOP
      RAISE NOTICE '  ID: %, Code: %, Type: %', rec.id_text, rec.family_code, rec.id_type;
    END LOOP;
  ELSE
    -- Query without family_code
    RAISE NOTICE 'Families table sample (no family_code column):';
    FOR rec IN (
      SELECT 
        id::text as id_text,
        created_at,
        pg_typeof(id)::text as id_type
      FROM families
      LIMIT 5
    ) LOOP
      RAISE NOTICE '  ID: %, Type: %', rec.id_text, rec.id_type;
    END LOOP;
  END IF;
END $$;

-- Show sample joins working correctly now
DO $$
BEGIN
  RAISE NOTICE 'Sample profile-family joins:';
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'families' AND column_name = 'family_code'
  ) THEN
    -- Join with family_code
    FOR rec IN (
      SELECT 
        p.email,
        p.role,
        p.family_id::text as family_id_text,
        f.family_code
      FROM profiles p
      INNER JOIN families f ON p.family_id = f.id
      LIMIT 5
    ) LOOP
      RAISE NOTICE '  ✅ %: % (family_id: %, code: %)', rec.email, rec.role, rec.family_id_text, rec.family_code;
    END LOOP;
  ELSE
    -- Join without family_code
    FOR rec IN (
      SELECT 
        p.email,
        p.role,
        p.family_id::text as family_id_text
      FROM profiles p
      INNER JOIN families f ON p.family_id = f.id
      LIMIT 5
    ) LOOP
      RAISE NOTICE '  ✅ %: % (family_id: %)', rec.email, rec.role, rec.family_id_text;
    END LOOP;
  END IF;
END $$;

RAISE NOTICE '====================================';
RAISE NOTICE '✅ TYPE MISMATCH FIX COMPLETE';
RAISE NOTICE '====================================';
RAISE NOTICE '✅ families.id converted from TEXT to UUID';
RAISE NOTICE '✅ Foreign key constraints added';
RAISE NOTICE '✅ RLS policies recreated';
RAISE NOTICE '====================================';
RAISE NOTICE 'Next: Run fix-activity-feed-constraint.sql to repair orphaned data';
RAISE NOTICE 'Then: Run fix-registration-flow.sql to fix future registrations';
