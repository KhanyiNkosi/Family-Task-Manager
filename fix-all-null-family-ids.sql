-- ============================================================================
-- FIX ALL REMAINING NULL FAMILY_IDs
-- ============================================================================
-- Catches any users the previous backfill missed
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_new_family_id UUID;
  v_affected_count INTEGER;
  v_fixed_count INTEGER := 0;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'CHECKING FOR REMAINING NULL FAMILY_IDS';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  
  -- Count affected users
  SELECT COUNT(*) INTO v_affected_count
  FROM profiles
  WHERE family_id IS NULL;
  
  RAISE NOTICE 'Found % user(s) with NULL family_id', v_affected_count;
  
  IF v_affected_count = 0 THEN
    RAISE NOTICE '✅ No users need fixing!';
    RETURN;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Processing affected users...';
  RAISE NOTICE '';
  
  -- Loop through ALL users with NULL family_id (parents and children)
  FOR v_user_id, v_user_email IN
    SELECT id, email
    FROM profiles
    WHERE family_id IS NULL
    ORDER BY created_at
  LOOP
    -- Generate new family_id
    v_new_family_id := gen_random_uuid();
    
    RAISE NOTICE 'Processing: %', v_user_email;
    RAISE NOTICE '  User ID: %', v_user_id;
    RAISE NOTICE '  Creating family: %', v_new_family_id;
    
    -- Create family record
    BEGIN
      INSERT INTO public.families (id, owner_id, created_at)
      VALUES (v_new_family_id::text, v_user_id, NOW())
      ON CONFLICT (id) DO NOTHING;
      
      -- Update profile with family_id
      UPDATE public.profiles
      SET family_id = v_new_family_id,
          updated_at = NOW()
      WHERE id = v_user_id;
      
      v_fixed_count := v_fixed_count + 1;
      RAISE NOTICE '  ✅ Fixed';
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '  ❌ Failed to fix %: %', v_user_email, SQLERRM;
    END;
    
    RAISE NOTICE '';
  END LOOP;
  
  -- Final verification
  SELECT COUNT(*) INTO v_affected_count
  FROM profiles
  WHERE family_id IS NULL;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Fixed % user(s)', v_fixed_count;
  IF v_affected_count = 0 THEN
    RAISE NOTICE '✅ SUCCESS: All users now have family_id';
  ELSE
    RAISE NOTICE '⚠️  WARNING: Still % user(s) with NULL family_id', v_affected_count;
  END IF;
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Next step: Users must HARD REFRESH browser (Ctrl+Shift+R)';
  RAISE NOTICE '';
END $$;

-- Show all users and their family status
SELECT 
  SUBSTRING(email, 1, 40) as email,
  role,
  family_id,
  CASE 
    WHEN family_id IS NULL THEN '❌ NULL'
    ELSE '✅ HAS FAMILY'
  END as status,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 20;
