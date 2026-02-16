-- ============================================================================
-- FIX SPECIFIC USER: kayteenproton.me@proton.me
-- ============================================================================
-- This user has NULL family_id - create family and assign it
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID := 'f6585a32-cfa0-4c8f-9d32-8fc22aed6d95';
  v_user_email TEXT := 'kayteenproton.me@proton.me';
  v_new_family_id UUID;
BEGIN
  -- Check current state
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Fixing user: %', v_user_email;
  RAISE NOTICE '====================================';
  
  -- Generate new family_id
  v_new_family_id := gen_random_uuid();
  
  RAISE NOTICE 'Creating family: %', v_new_family_id;
  
  -- Create family record
  INSERT INTO public.families (id, owner_id, created_at)
  VALUES (v_new_family_id::text, v_user_id, NOW())
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE '✅ Family created';
  
  -- Update profile with family_id
  UPDATE public.profiles
  SET family_id = v_new_family_id,
      updated_at = NOW()
  WHERE id = v_user_id;
  
  RAISE NOTICE '✅ Profile updated with family_id';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Family Code: %', v_new_family_id;
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: User should HARD REFRESH browser (Ctrl+Shift+R)';
  RAISE NOTICE '';
END $$;

-- Verify the fix
SELECT 
  email,
  role,
  family_id,
  CASE 
    WHEN family_id IS NULL THEN '❌ STILL NULL'
    ELSE '✅ FIXED - Family ID: ' || family_id::text
  END as status
FROM profiles
WHERE id = 'f6585a32-cfa0-4c8f-9d32-8fc22aed6d95';
