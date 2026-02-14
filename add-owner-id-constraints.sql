-- ============================================================================
-- Add owner_id Constraints and Index to Families Table
-- ============================================================================
-- Adds FK constraint and index for families.owner_id → profiles.id
-- Run AFTER all families have owner_id populated
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Adding owner_id constraints...';
  RAISE NOTICE '====================================';
END $$;

-- ============================================================================
-- STEP 1: Verify all families have owner_id
-- ============================================================================

DO $$
DECLARE
  v_families_without_owner INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_families_without_owner
  FROM families
  WHERE owner_id IS NULL;
  
  IF v_families_without_owner > 0 THEN
    RAISE EXCEPTION 'Cannot add NOT NULL: % families have NULL owner_id. Run fix-missing-owner-ids.sql first!', 
      v_families_without_owner;
  END IF;
  
  RAISE NOTICE '✅ All families have owner_id set';
END $$;

-- ============================================================================
-- STEP 2: Verify all owner_id values reference valid profiles
-- ============================================================================

DO $$
DECLARE
  v_invalid_owners INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_invalid_owners
  FROM families f
  WHERE owner_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = f.owner_id
    );
  
  IF v_invalid_owners > 0 THEN
    RAISE EXCEPTION 'Cannot add FK: % families have invalid owner_id (profile does not exist)', 
      v_invalid_owners;
  END IF;
  
  RAISE NOTICE '✅ All owner_id values reference valid profiles';
END $$;

-- ============================================================================
-- STEP 3: Create index on families(owner_id) for query performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_families_owner_id ON families(owner_id);

DO $$
BEGIN
  RAISE NOTICE '✅ Created index on families(owner_id)';
END $$;

-- ============================================================================
-- STEP 4: Add FK constraint families.owner_id → profiles.id
-- ============================================================================

ALTER TABLE families
  DROP CONSTRAINT IF EXISTS fk_families_owner;

ALTER TABLE families
  ADD CONSTRAINT fk_families_owner
  FOREIGN KEY (owner_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL;  -- If owner profile deleted, set to NULL (family persists)

DO $$
BEGIN
  RAISE NOTICE '✅ Added FK constraint: families.owner_id → profiles.id';
END $$;

-- ============================================================================
-- STEP 5: Add NOT NULL constraint (ensures every family has an owner)
-- ============================================================================

-- Note: We do this AFTER FK to ensure referential integrity is enforced first
ALTER TABLE families
  ALTER COLUMN owner_id SET NOT NULL;

DO $$
BEGIN
  RAISE NOTICE '✅ Added NOT NULL constraint on families.owner_id';
END $$;

-- ============================================================================
-- VERIFICATION: Show all constraints
-- ============================================================================

SELECT 
  'Constraint Verification' as check_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column,
  '✅ Active' as status
FROM information_schema.table_constraints AS tc
LEFT JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'families'
  AND kcu.column_name = 'owner_id'
ORDER BY tc.constraint_type;

-- ============================================================================
-- VERIFICATION: Show column constraints
-- ============================================================================

SELECT 
  'Column Constraint Check' as check_name,
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN is_nullable = 'NO' THEN '✅ NOT NULL enforced'
    ELSE '⚠️ Nullable'
  END as constraint_status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'families'
  AND column_name = 'owner_id';

-- ============================================================================
-- VERIFICATION: Test that all families still valid
-- ============================================================================

SELECT 
  'Family Ownership Validation' as check_name,
  COUNT(*) as total_families,
  COUNT(owner_id) as families_with_owner,
  COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as families_with_valid_owner,
  CASE 
    WHEN COUNT(*) = COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) THEN '✅ All families have valid owners'
    ELSE '❌ Some families have invalid owners'
  END as status
FROM families f
LEFT JOIN profiles p ON f.owner_id = p.id;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅✅✅ OWNER CONSTRAINTS ADDED! ✅✅✅';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Database integrity complete:';
  RAISE NOTICE '  ✅ families.owner_id → profiles.id (FK)';
  RAISE NOTICE '  ✅ families.owner_id NOT NULL';
  RAISE NOTICE '  ✅ Index on families(owner_id)';
  RAISE NOTICE '';
  RAISE NOTICE 'New families will now REQUIRE an owner!';
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '🎉 MIGRATION 100%% COMPLETE! 🎉';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Ready for production testing:';
  RAISE NOTICE '  1. Test existing users (family 32af85db...)';
  RAISE NOTICE '  2. Test new parent signup';
  RAISE NOTICE '  3. Test new child signup';
  RAISE NOTICE '  4. Push to GitHub (33 commits)';
END $$;
