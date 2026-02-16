-- ============================================================================
-- IMMEDIATE FIX: nkazimulokometsi@gmail.com user
-- ============================================================================
-- User ID: a86f3d4b-8031-4586-9687-f57d20707634
-- Issue: NULL family_id (trigger didn't work)
-- Fix: Create family and update profile NOW
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID := 'a86f3d4b-8031-4586-9687-f57d20707634';
  v_family_id UUID;
  v_existing_family TEXT;
  v_role TEXT;
BEGIN
  -- Get user's role
  SELECT role INTO v_role
  FROM profiles
  WHERE id = v_user_id;
  
  RAISE NOTICE 'User role: %', v_role;
  
  -- Check if family already exists for this user
  SELECT id INTO v_existing_family
  FROM families
  WHERE owner_id = v_user_id;
  
  IF v_existing_family IS NOT NULL THEN
    -- Family exists, just update profile
    RAISE NOTICE 'Family already exists: %', v_existing_family;
    
    UPDATE profiles
    SET family_id = v_existing_family::uuid
    WHERE id = v_user_id;
    
    RAISE NOTICE '✅ FIXED: Updated profile.family_id to existing family';
  ELSE
    -- Create new family
    v_family_id := gen_random_uuid();
    
    RAISE NOTICE 'Creating new family: %', v_family_id;
    
    INSERT INTO families (id, owner_id, created_at)
    VALUES (v_family_id::text, v_user_id, NOW());
    
    -- Update profile
    UPDATE profiles
    SET family_id = v_family_id
    WHERE id = v_user_id;
    
    RAISE NOTICE '✅ FIXED: Created family % and updated profile', v_family_id;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'USER FIXED - Refresh page now!';
  RAISE NOTICE '====================================';
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '❌ FIX FAILED: %', SQLERRM;
  RAISE WARNING 'SQLSTATE: %', SQLSTATE;
END $$;

-- Verify the fix
SELECT 
  p.email,
  p.role,
  p.family_id,
  f.id as family_exists,
  CASE 
    WHEN p.family_id IS NOT NULL AND f.id IS NOT NULL 
    THEN '✅ FIXED - User has family code!'
    ELSE '❌ Still broken'
  END as status
FROM profiles p
LEFT JOIN families f ON f.owner_id = p.id
WHERE p.id = 'a86f3d4b-8031-4586-9687-f57d20707634';
