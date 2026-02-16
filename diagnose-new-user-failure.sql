-- ============================================================================
-- EMERGENCY DIAGNOSTIC: New user still has NULL family_id
-- ============================================================================
-- User: nkazimulokometsi@gmail.com
-- User ID: a86f3d4b-8031-4586-9687-f57d20707634
-- Issue: Trigger supposed to be fixed but new users still affected
-- ============================================================================

-- Check 1: Does this user exist in auth.users?
SELECT 
  'auth.users' as location,
  id,
  email,
  created_at,
  CASE 
    WHEN created_at > NOW() - INTERVAL '5 minutes' THEN '🆕 JUST CREATED'
    ELSE '⏰ Created ' || (NOW() - created_at) || ' ago'
  END as age
FROM auth.users 
WHERE id = 'a86f3d4b-8031-4586-9687-f57d20707634';

-- Check 2: Does this user have a profile?
SELECT 
  'profiles' as location,
  id,
  email,
  role,
  family_id,
  CASE 
    WHEN family_id IS NULL THEN '❌ NULL - PROBLEM!'
    ELSE '✅ Has family_id: ' || family_id
  END as family_status,
  created_at
FROM profiles 
WHERE id = 'a86f3d4b-8031-4586-9687-f57d20707634';

-- Check 3: Does a family exist for this user as owner?
SELECT 
  'families' as location,
  id,
  owner_id,
  created_at,
  '✅ Family exists' as status
FROM families 
WHERE owner_id = 'a86f3d4b-8031-4586-9687-f57d20707634';

-- Check 4: Verify trigger is still attached
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing,
  CASE 
    WHEN trigger_name = 'on_auth_user_created' THEN '✅ Trigger exists'
    ELSE '⚠️ Different trigger name'
  END as status
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
  AND action_timing = 'AFTER'
  AND event_manipulation = 'INSERT';

-- Check 5: Get current trigger function source
SELECT 
  'Current trigger function source:' as info,
  prosrc as function_body
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Check 6: Check for any errors in recent logs (if pg_stat_statements available)
-- This might not work depending on Supabase permissions
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'CHECKING TRIGGER EXECUTION';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'If the trigger fired but failed silently:';
  RAISE NOTICE '- Check Supabase logs for WARNINGS';
  RAISE NOTICE '- Look for "CRITICAL: handle_new_user failed"';
  RAISE NOTICE '- Check for SQLSTATE error codes';
  RAISE NOTICE '';
END $$;

-- Check 7: Manually test if we can create a family for this user
DO $$
DECLARE
  v_user_id UUID := 'a86f3d4b-8031-4586-9687-f57d20707634';
  v_family_id UUID;
  v_existing_family_id TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'MANUAL FAMILY CREATION TEST';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  
  -- Check if family already exists
  SELECT id INTO v_existing_family_id
  FROM families
  WHERE owner_id = v_user_id;
  
  IF v_existing_family_id IS NOT NULL THEN
    RAISE NOTICE '✅ Family already exists: %', v_existing_family_id;
    RAISE NOTICE 'Problem is: profile.family_id is NULL but family exists!';
    RAISE NOTICE '';
    RAISE NOTICE 'This means the trigger created the family but failed to update the profile.';
    RAISE NOTICE 'Running fix now...';
    
    -- Fix the profile
    UPDATE profiles 
    SET family_id = v_existing_family_id::uuid
    WHERE id = v_user_id;
    
    RAISE NOTICE '✅ FIXED: Updated profile.family_id to %', v_existing_family_id;
  ELSE
    RAISE NOTICE '❌ No family exists for this user';
    RAISE NOTICE 'This means the trigger did NOT execute at all, or it failed completely.';
    RAISE NOTICE '';
    RAISE NOTICE 'Creating family and fixing profile now...';
    
    -- Create the family
    v_family_id := gen_random_uuid();
    
    INSERT INTO families (id, owner_id, created_at)
    VALUES (v_family_id::text, v_user_id, NOW());
    
    -- Update the profile
    UPDATE profiles 
    SET family_id = v_family_id
    WHERE id = v_user_id;
    
    RAISE NOTICE '✅ FIXED: Created family % and updated profile', v_family_id;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'User should now be able to see their family code!';
  RAISE NOTICE 'Tell user to refresh the page (Ctrl+Shift+R)';
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '❌ FIX FAILED: %', SQLERRM;
  RAISE WARNING 'SQLSTATE: %', SQLSTATE;
END $$;

-- Check 8: Verify the fix worked
SELECT 
  p.id,
  p.email,
  p.role,
  p.family_id,
  f.id as family_table_id,
  f.owner_id,
  CASE 
    WHEN p.family_id IS NOT NULL AND f.id IS NOT NULL THEN '✅ FIXED - User now has family!'
    WHEN p.family_id IS NULL AND f.id IS NOT NULL THEN '⚠️ Family exists but profile.family_id still NULL'
    WHEN p.family_id IS NOT NULL AND f.id IS NULL THEN '⚠️ profile.family_id set but no family record'
    ELSE '❌ Still broken - no family at all'
  END as final_status
FROM profiles p
LEFT JOIN families f ON f.owner_id = p.id
WHERE p.id = 'a86f3d4b-8031-4586-9687-f57d20707634';
