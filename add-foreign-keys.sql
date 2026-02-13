-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS - Run AFTER fixing orphaned profiles
-- ============================================================================
-- This adds proper FK constraints now that types match and orphans are fixed
-- ============================================================================

BEGIN;

RAISE NOTICE '====================================';
RAISE NOTICE 'Adding Foreign Key Constraints...';
RAISE NOTICE '====================================';

-- ============================================================================
-- STEP 1: VERIFY NO ORPHANS REMAIN
-- ============================================================================

DO $$
DECLARE
  v_orphaned_profiles INTEGER;
  v_orphaned_activity INTEGER;
BEGIN
  -- Check profiles
  SELECT COUNT(*) INTO v_orphaned_profiles
  FROM profiles p
  WHERE p.family_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM families f WHERE f.id = p.family_id);
  
  -- Check activity_feed
  SELECT COUNT(*) INTO v_orphaned_activity
  FROM activity_feed af
  WHERE af.family_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM families f WHERE f.id = af.family_id);
  
  IF v_orphaned_profiles > 0 THEN
    RAISE EXCEPTION 'Cannot add FK: % orphaned profiles still exist. Fix them first!', v_orphaned_profiles;
  END IF;
  
  IF v_orphaned_activity > 0 THEN
    RAISE WARNING 'Warning: % orphaned activity_feed records exist', v_orphaned_activity;
  END IF;
  
  RAISE NOTICE '✅ Orphan check passed (profiles: %, activity_feed: %)', v_orphaned_profiles, v_orphaned_activity;
END $$;

-- ============================================================================
-- STEP 2: ADD FK CONSTRAINT - profiles.family_id → families.id
-- ============================================================================

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_family_id_fkey;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_family_id_fkey 
  FOREIGN KEY (family_id) 
  REFERENCES families(id) 
  ON DELETE SET NULL;

RAISE NOTICE '✅ Added FK constraint: profiles.family_id → families.id';

-- ============================================================================
-- STEP 3: ADD FK CONSTRAINT - activity_feed.family_id → families.id
-- ============================================================================

-- First, fix any orphaned activity_feed records
DO $$
DECLARE
  v_fixed_count INTEGER;
BEGIN
  -- Option 1: Set NULL for orphaned activity_feed
  UPDATE activity_feed
  SET family_id = NULL
  WHERE family_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM families f WHERE f.id = family_id);
  
  GET DIAGNOSTICS v_fixed_count = ROW_COUNT;
  
  IF v_fixed_count > 0 THEN
    RAISE NOTICE '⚠️ Set % orphaned activity_feed.family_id to NULL', v_fixed_count;
  END IF;
END $$;

ALTER TABLE activity_feed
  DROP CONSTRAINT IF EXISTS activity_feed_family_id_fkey;

ALTER TABLE activity_feed
  ADD CONSTRAINT activity_feed_family_id_fkey 
  FOREIGN KEY (family_id) 
  REFERENCES families(id) 
  ON DELETE CASCADE;

RAISE NOTICE '✅ Added FK constraint: activity_feed.family_id → families.id';

-- ============================================================================
-- STEP 4: ADD FK CONSTRAINT - tasks.family_id → families.id (if exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'tasks' 
      AND column_name = 'family_id'
  ) THEN
    -- Fix orphaned tasks
    UPDATE tasks
    SET family_id = NULL
    WHERE family_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM families f WHERE f.id = family_id);
    
    -- Add FK
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
-- STEP 5: CREATE INDEXES for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_families_id ON families(id);
CREATE INDEX IF NOT EXISTS idx_profiles_family_id ON profiles(family_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_family_id ON activity_feed(family_id);

RAISE NOTICE '✅ Created indexes for FK columns';

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show all FK constraints
SELECT 
  'Foreign Key Constraints' as check_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column,
  rc.delete_rule as on_delete
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'families'
ORDER BY tc.table_name;

-- Verify no orphans
SELECT 
  'Final Orphan Check' as check_name,
  'profiles' as table_name,
  COUNT(*) as orphan_count
FROM profiles p
WHERE p.family_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM families f WHERE f.id = p.family_id)
UNION ALL
SELECT 
  'Final Orphan Check' as check_name,
  'activity_feed' as table_name,
  COUNT(*) as orphan_count
FROM activity_feed af
WHERE af.family_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM families f WHERE f.id = af.family_id);

RAISE NOTICE '====================================';
RAISE NOTICE '✅ FOREIGN KEY CONSTRAINTS ADDED';
RAISE NOTICE '====================================';
