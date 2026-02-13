-- ============================================================================
-- CONVERT profiles.family_id from UUID to TEXT
-- ============================================================================
-- Problem: profiles.family_id is UUID but families.id is TEXT
-- Solution: Convert profiles.family_id to TEXT to match families.id
-- This is simpler than converting families.id to UUID (which has RLS issues)
-- ============================================================================

BEGIN;

RAISE NOTICE '====================================';
RAISE NOTICE 'Converting profiles.family_id to TEXT...';
RAISE NOTICE '====================================';

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
-- STEP 2: DROP DEPENDENT CONSTRAINTS (if any exist)
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
-- STEP 3: CONVERT profiles.family_id from UUID to TEXT
-- ============================================================================

-- Convert the column type (UUID values will automatically convert to text)
ALTER TABLE profiles 
  ALTER COLUMN family_id TYPE TEXT USING family_id::TEXT;

RAISE NOTICE '✅ Converted profiles.family_id from UUID to TEXT';

-- ============================================================================
-- STEP 4: VERIFY THE CONVERSION
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

RAISE NOTICE '====================================';
RAISE NOTICE '✅ PROFILES.FAMILY_ID CONVERTED TO TEXT';
RAISE NOTICE '====================================';
RAISE NOTICE 'Next: Run add-foreign-keys.sql to add FK constraints';
