-- ============================================================================
-- ADD DEFAULT REWARDS CREATION TO REGISTRATION TRIGGER
-- ============================================================================
-- This updates handle_new_user() to automatically create 3 default rewards
-- when a new family is created during parent registration

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
    
    -- Create default rewards for the new family
    INSERT INTO public.rewards (title, description, points_cost, family_id, created_by, is_active, is_default)
    VALUES 
      ('🍦 Ice Cream Treat', 'Enjoy a delicious ice cream treat!', 20, v_family_id::text, NEW.id, true, true),
      ('📱 30 Mins Screen Time', 'Extra 30 minutes of screen time for your favorite activity!', 30, v_family_id::text, NEW.id, true, true),
      ('🎮 1 Hour Video Games', 'One full hour to play your favorite video games!', 50, v_family_id::text, NEW.id, true, true)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ Created 3 default rewards';
  
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

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ handle_new_user() updated with default rewards creation';
  RAISE NOTICE '✅ New parent registrations will automatically get:';
  RAISE NOTICE '   - Family record';
  RAISE NOTICE '   - Profile with family_id';
  RAISE NOTICE '   - User settings';
  RAISE NOTICE '   - 3 default rewards (Ice Cream, Screen Time, Video Games)';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
END $$;
