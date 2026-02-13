-- Fix Registration Flow - Create families table entries properly
-- This replaces the buggy handle_new_user() function

-- ============================================================================
-- FIXED REGISTRATION TRIGGER
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

  -- ========================================================================
  -- HANDLE PARENT REGISTRATION
  -- ========================================================================
  IF v_role = 'parent' THEN
    -- Generate new family_id for parent
    v_family_id := gen_random_uuid();
    
    -- CREATE THE FAMILIES TABLE ENTRY (This was missing!)
    INSERT INTO public.families (id, family_code, created_at, created_by)
    VALUES (
      v_family_id,
      -- Generate readable 8-character family code from UUID
      UPPER(SUBSTRING(REPLACE(v_family_id::text, '-', '') FROM 1 FOR 8)),
      NOW(),
      NEW.id
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Created family % for parent %', v_family_id, NEW.id;
  
  -- ========================================================================
  -- HANDLE CHILD REGISTRATION
  -- ========================================================================
  ELSE
    -- Child MUST have family_code
    IF v_family_code IS NULL OR v_family_code = '' THEN
      RAISE EXCEPTION 'Family code is required for child accounts';
    END IF;
    
    -- Check if family exists in families table
    BEGIN
      v_family_id := v_family_code::UUID;
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'Invalid family code format';
    END;
    
    SELECT EXISTS(SELECT 1 FROM public.families WHERE id = v_family_id) INTO v_family_exists;
    
    IF NOT v_family_exists THEN
      -- Family doesn't exist - try to find it from another child's profile (migration case)
      SELECT family_id INTO v_family_id
      FROM public.profiles
      WHERE family_id = v_family_id
      LIMIT 1;
      
      IF v_family_id IS NOT NULL THEN
        -- Create the missing family record
        INSERT INTO public.families (id, family_code, created_at, created_by)
        VALUES (
          v_family_id,
          UPPER(SUBSTRING(REPLACE(v_family_id::text, '-', '') FROM 1 FOR 8)),
          NOW(),
          (SELECT id FROM profiles WHERE family_id = v_family_id AND role = 'parent' LIMIT 1)
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE WARNING 'Created missing family record % during child registration', v_family_id;
      ELSE
        RAISE EXCEPTION 'Invalid family code - family does not exist. Please check with your parent.';
      END IF;
    END IF;
    
    RAISE NOTICE 'Added child % to family %', NEW.id, v_family_id;
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

  -- ========================================================================
  -- INSERT INTO USER_PROFILES TABLE (if exists)
  -- ========================================================================
  INSERT INTO public.user_profiles (id, role, total_points)
  VALUES (
    NEW.id,
    v_role,
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Error in handle_new_user for %: %', NEW.id, SQLERRM;
    
    -- Still insert basic profile without family
    INSERT INTO public.profiles (id, email, full_name, role, family_id)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      v_role,
      NULL  -- No family_id if there was an error
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RECREATE TRIGGER
-- ============================================================================

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that families are being created
SELECT 
  'Family Creation Check' as check_name,
  COUNT(*) as total_families,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 day' THEN 1 END) as families_created_today
FROM families;

-- Check for orphaned profiles (should be 0 after fix)
SELECT 
  'Orphaned Profiles Check' as check_name,
  COUNT(*) as orphaned_count
FROM profiles p
LEFT JOIN families f ON p.family_id = f.id
WHERE p.family_id IS NOT NULL AND f.id IS NULL;

-- Show recent registrations with family status
SELECT 
  u.email,
  u.created_at,
  p.role,
  p.family_id,
  CASE 
    WHEN f.id IS NOT NULL THEN '✅ Family Exists'
    WHEN p.family_id IS NULL THEN '⚠️ No Family Assigned'
    ELSE '❌ Orphaned - Family Missing'
  END as family_status,
  f.family_code
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN families f ON p.family_id = f.id
WHERE u.created_at > NOW() - INTERVAL '7 days'
ORDER BY u.created_at DESC
LIMIT 20;
