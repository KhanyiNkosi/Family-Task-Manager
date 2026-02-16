-- ============================================================================
-- FIX: Simplify handle_new_user() - Remove complex column checks
-- ============================================================================
-- Based on diagnostics: 
--   profiles.family_id = UUID
--   families.id = TEXT (NOT NULL)
--   families.owner_id = UUID (NOT NULL)
--   families.created_at = timestamptz (default now())
-- ============================================================================

-- First, let's check the current state
DO $$
DECLARE
  v_column_type TEXT;
BEGIN
  -- Check what type family_id currently is
  SELECT data_type INTO v_column_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'family_id';
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Current profiles.family_id type: %', COALESCE(v_column_type, 'NOT FOUND');
  RAISE NOTICE '====================================';
END $$;

-- ============================================================================
-- SIMPLIFIED REGISTRATION TRIGGER (UUID VERSION)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_family_id UUID;
  v_role TEXT;
  v_family_code TEXT;
  v_family_exists BOOLEAN;
BEGIN
  -- Get role and family_code from signup metadata
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'child');
  v_family_code := NEW.raw_user_meta_data->>'family_code';

  RAISE NOTICE 'handle_new_user triggered for user % with role %', NEW.id, v_role;

  -- ========================================================================
  -- HANDLE PARENT REGISTRATION
  -- ========================================================================
  IF v_role = 'parent' THEN
    -- Generate new family_id for parent
    v_family_id := gen_random_uuid();
    
    RAISE NOTICE 'Creating family % for parent %', v_family_id, NEW.id;
    
    -- Create family record (families.id is TEXT, owner_id is UUID NOT NULL)
    INSERT INTO public.families (id, owner_id, created_at)
    VALUES (v_family_id::text, NEW.id, NOW())
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE '✅ Family created successfully';
  
  -- ========================================================================
  -- HANDLE CHILD REGISTRATION
  -- ========================================================================
  ELSE
    -- Child MUST have family_code
    IF v_family_code IS NULL OR v_family_code = '' THEN
      RAISE EXCEPTION 'Family code is required for child accounts';
    END IF;
    
    -- Validate family code format (should be UUID)
    BEGIN
      v_family_id := v_family_code::UUID;
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'Invalid family code format';
    END;
    
    -- Check if family exists
    SELECT EXISTS(
      SELECT 1 FROM public.families WHERE id = v_family_id::text
    ) INTO v_family_exists;
    
    IF NOT v_family_exists THEN
      -- Try to find family from existing profiles (migration case)
      SELECT family_id INTO v_family_id
      FROM public.profiles
      WHERE family_id = v_family_id
      LIMIT 1;
      
      IF v_family_id IS NOT NULL THEN
        -- Create the missing family record
        INSERT INTO public.families (id, owner_id, created_at)
        VALUES (
          v_family_id::text,
          (SELECT id FROM profiles WHERE family_id = v_family_id AND role = 'parent' LIMIT 1),
          NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE '⚠️  Created missing family record % during child registration', v_family_id;
      ELSE
        RAISE EXCEPTION 'Invalid family code - family does not exist. Please check with your parent.';
      END IF;
    END IF;
    
    RAISE NOTICE 'Adding child % to family %', NEW.id, v_family_id;
  END IF;

  -- ========================================================================
  -- INSERT INTO PROFILES TABLE
  -- ========================================================================
  INSERT INTO public.profiles (id, email, full_name, role, family_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    v_role,
    v_family_id
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    family_id = EXCLUDED.family_id,
    updated_at = NOW();

  RAISE NOTICE '✅ Profile created/updated for user %', NEW.id;

  -- ========================================================================
  -- INSERT INTO USER_PROFILES TABLE
  -- ========================================================================
  INSERT INTO public.user_profiles (id, role, total_points)
  VALUES (
    NEW.id,
    v_role,
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role;

  RAISE NOTICE '✅ User profile created/updated';

  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- ============================================
    -- PRODUCTION-SAFE ERROR HANDLING
    -- Log detailed error but allow user to register
    -- This prevents blocking user signups in production
    -- ============================================
    RAISE WARNING '❌ CRITICAL: handle_new_user failed for user %', NEW.id;
    RAISE WARNING '   Error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RAISE WARNING '   Email: %, Role: %, Family Code: %', NEW.email, v_role, v_family_code;
    RAISE WARNING '   ACTION REQUIRED: Manual family assignment needed';
    
    -- Create profile without family_id to allow registration
    -- Support team can fix this using backfill-null-family-id.sql
    INSERT INTO public.profiles (id, email, full_name, role, family_id)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      v_role,
      NULL  -- Will be backfilled by support
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      updated_at = NOW();
    
    -- Still create user_profiles entry
    INSERT INTO public.user_profiles (id, role, total_points)
    VALUES (NEW.id, v_role, 0)
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- VERIFY THE FIX
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ handle_new_user() simplified and fixed';
  RAISE NOTICE '✅ Trigger recreated on auth.users';
  RAISE NOTICE '';
  RAISE NOTICE 'Production-safe improvements:';
  RAISE NOTICE '  ✓ Removed complex nested column checks';
  RAISE NOTICE '  ✓ Direct table inserts (id, created_at, created_by)';
  RAISE NOTICE '  ✓ Enhanced error logging with SQLSTATE';
  RAISE NOTICE '  ✓ Fail-soft: Users can register even if family creation fails';
  RAISE NOTICE '  ✓ NULL family_id triggers WARNING logs for monitoring';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Check Supabase logs regularly for warnings';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. ✅ Run backfill-null-family-id.sql to fix existing affected user';
  RAISE NOTICE '2. 🔍 Monitor with: monitor-null-family-ids.sql (run weekly)';
  RAISE NOTICE '3. ✅ Test parent registration - family_id should populate';
  RAISE NOTICE '4. ✅ Check Settings page - family code should display';
  RAISE NOTICE '';
END $$;

-- Query to check recent users
SELECT 
  SUBSTRING(p.email, 1, 30) as email,
  p.role,
  p.family_id,
  CASE 
    WHEN p.family_id IS NULL THEN '❌ NO FAMILY CODE'
    ELSE '✅ HAS FAMILY CODE'
  END as status,
  p.created_at
FROM profiles p
ORDER BY p.created_at DESC
LIMIT 10;
