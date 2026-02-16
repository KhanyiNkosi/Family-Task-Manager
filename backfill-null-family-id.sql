-- ============================================================================
-- BACKFILL: Fix NULL family_id for affected parent
-- ============================================================================
-- This creates a family for the parent with NULL family_id
-- SCHEMA NOTE: families.id is TEXT, profiles.family_id is UUID
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_new_family_id UUID;
  v_affected_count INTEGER;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'BACKFILLING NULL FAMILY_ID FOR PARENTS';
  RAISE NOTICE 'Schema: families.id = TEXT, owner_id = UUID (NOT NULL)';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  
  -- Find parents with NULL family_id
  SELECT COUNT(*) INTO v_affected_count
  FROM profiles
  WHERE role = 'parent' AND family_id IS NULL;
  
  RAISE NOTICE 'Found % parent(s) with NULL family_id', v_affected_count;
  RAISE NOTICE '';
  
  -- Loop through each affected parent
  FOR v_user_id, v_user_email IN
    SELECT id, email
    FROM profiles
    WHERE role = 'parent' AND family_id IS NULL
    ORDER BY created_at
  LOOP
    -- Generate new family_id
    v_new_family_id := gen_random_uuid();
    
    RAISE NOTICE 'Processing: % (ID: %)', v_user_email, v_user_id;
    RAISE NOTICE '  Creating family: %', v_new_family_id;
    
    -- Create family record (id cast to TEXT, owner_id is UUID)
    INSERT INTO public.families (id, owner_id, created_at)
    VALUES (v_new_family_id::text, v_user_id, NOW())
    ON CONFLICT (id) DO NOTHING;
    
    -- Update profile with family_id
    UPDATE public.profiles
    SET family_id = v_new_family_id,
        updated_at = NOW()
    WHERE id = v_user_id;
    
    RAISE NOTICE '  ✅ Updated profile with family_id';
    RAISE NOTICE '';
  END LOOP;
  
  -- Verify fix
  SELECT COUNT(*) INTO v_affected_count
  FROM profiles
  WHERE role = 'parent' AND family_id IS NULL;
  
  RAISE NOTICE '====================================';
  IF v_affected_count = 0 THEN
    RAISE NOTICE '✅ SUCCESS: All parents now have family_id';
  ELSE
    RAISE NOTICE '⚠️  WARNING: Still % parent(s) with NULL family_id', v_affected_count;
  END IF;
  RAISE NOTICE '====================================';
END $$;

-- Show updated profiles
SELECT 
  SUBSTRING(email, 1, 30) as email,
  role,
  family_id,
  CASE 
    WHEN family_id IS NULL THEN '❌ NULL'
    ELSE '✅ HAS FAMILY'
  END as status,
  created_at
FROM profiles
WHERE role = 'parent'
ORDER BY created_at DESC
LIMIT 10;
