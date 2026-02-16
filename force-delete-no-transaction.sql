-- ============================================================================
-- FORCE DELETE - Handles FK constraints properly
-- ============================================================================
-- Deletes families first, then profiles, then auth.users
-- No transaction rollback - each step independent
-- ============================================================================

-- === USER 1: kometsinkanyezi@gmail.com ===

-- Step 1.1: Delete family (must be FIRST)
DO $$
BEGIN
  DELETE FROM families WHERE id = '3c2388ee-148a-4b3c-9a2e-f56236826946';
  RAISE NOTICE 'User 1: Family deleted';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'User 1: Family delete failed: % (may already be deleted)', SQLERRM;
END $$;

-- Step 1.2: Delete profile
DO $$
BEGIN
  DELETE FROM profiles WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e';
  RAISE NOTICE 'User 1: Profile deleted';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'User 1: Profile delete failed: %', SQLERRM;
END $$;

-- Step 1.3: Delete auth user
DO $$
BEGIN
  DELETE FROM auth.users WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e';
  RAISE NOTICE 'User 1: Auth user deleted';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'User 1: Auth delete failed: %', SQLERRM;
END $$;

-- === USER 2: nkazimulokometsi@gmail.com ===

-- Step 2.1: Find and delete family
DO $$
DECLARE
  v_family_id TEXT;
BEGIN
  SELECT id INTO v_family_id FROM families WHERE owner_id = 'a86f3d4b-8031-4586-9687-f57d20707634';
  
  IF v_family_id IS NOT NULL THEN
    DELETE FROM families WHERE id = v_family_id;
    RAISE NOTICE 'User 2: Family % deleted', v_family_id;
  ELSE
    RAISE NOTICE 'User 2: No family found';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'User 2: Family delete failed: %', SQLERRM;
END $$;

-- Step 2.2: Delete profile
DO $$
BEGIN
  DELETE FROM profiles WHERE id = 'a86f3d4b-8031-4586-9687-f57d20707634';
  RAISE NOTICE 'User 2: Profile deleted';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'User 2: Profile delete failed: %', SQLERRM;
END $$;

-- Step 2.3: Delete auth user
DO $$
BEGIN
  DELETE FROM auth.users WHERE id = 'a86f3d4b-8031-4586-9687-f57d20707634';
  RAISE NOTICE 'User 2: Auth user deleted';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'User 2: Auth delete failed: %', SQLERRM;
END $$;

-- === VERIFICATION ===

SELECT 
  'FINAL CHECK' as status,
  (SELECT COUNT(*) FROM auth.users WHERE id IN (
    'bd1bb7db-f19b-4d16-b61f-42632d414f2e',
    'a86f3d4b-8031-4586-9687-f57d20707634'
  )) as users_remaining,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users WHERE id IN (
      'bd1bb7db-f19b-4d16-b61f-42632d414f2e',
      'a86f3d4b-8031-4586-9687-f57d20707634'
    )) = 0
    THEN '✅✅ SUCCESS - Both deleted!'
    ELSE '❌ Still have users - see error messages above'
  END as result;
