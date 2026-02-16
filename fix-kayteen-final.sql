-- ============================================================================
-- FIX: Create family for kayteenproton user
-- ============================================================================
-- User f6585a32-cfa0-4c8f-9d32-8fc22aed6d95 has NULL family_id
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID := 'f6585a32-cfa0-4c8f-9d32-8fc22aed6d95';
  v_new_family_id UUID := gen_random_uuid();
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Creating family for kayteenproton.me@proton.me';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'New Family ID: %', v_new_family_id;
  RAISE NOTICE '====================================';
  
  -- Create family record
  INSERT INTO public.families (id, owner_id, created_at)
  VALUES (v_new_family_id::text, v_user_id, NOW())
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE '✅ Family created in families table';
  
  -- Update profile with family_id
  UPDATE public.profiles
  SET family_id = v_new_family_id,
      updated_at = NOW()
  WHERE id = v_user_id;
  
  RAISE NOTICE '✅ Profile updated with family_id';
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Family Code: %', v_new_family_id;
  RAISE NOTICE 'Invitation Code: %', UPPER(SUBSTRING(REPLACE(v_new_family_id::text, '-', '') FROM 1 FOR 6));
  RAISE NOTICE '====================================';
END $$;

-- Verify the fix (bypass RLS to see result)
SELECT 
  email,
  role,
  family_id,
  CASE 
    WHEN family_id IS NULL THEN '❌ STILL NULL - FIX FAILED'
    ELSE '✅ FIXED - Family: ' || family_id::text
  END as status
FROM profiles
WHERE id = 'f6585a32-cfa0-4c8f-9d32-8fc22aed6d95';

-- Verify family exists
SELECT 
  id,
  owner_id,
  invitation_code,
  created_at,
  '✅ Family created successfully' as status
FROM families
WHERE owner_id = 'f6585a32-cfa0-4c8f-9d32-8fc22aed6d95';
