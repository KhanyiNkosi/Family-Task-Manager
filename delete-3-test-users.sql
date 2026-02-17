-- ============================================================================
-- DELETE 3 TEST USERS - Complete Cleanup Script
-- ============================================================================
-- This script will help you identify and delete 3 test users
-- Run each section carefully and replace the UUIDs with actual user IDs
-- ============================================================================

-- STEP 1: View all current users to identify which 3 to delete
-- ============================================================================
SELECT 
  u.id as user_id,
  u.email,
  u.created_at,
  p.full_name,
  p.role,
  p.family_id,
  f.family_code
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN families f ON p.family_id = f.id
ORDER BY u.created_at DESC;

-- Copy the user_id and family_id values from above for the 3 users you want to delete


-- ============================================================================
-- STEP 2: DELETE USER 1 - Replace UUIDs below
-- ============================================================================
DO $$ 
DECLARE
  v_user_id UUID := 'USER_ID_HERE';  -- Replace with actual user ID
  v_family_id UUID;
BEGIN
  -- Get family_id
  SELECT family_id INTO v_family_id FROM profiles WHERE id = v_user_id;
  
  RAISE NOTICE 'Deleting User 1: %', v_user_id;
  
  -- Delete rewards if family exists
  IF v_family_id IS NOT NULL THEN
    DELETE FROM rewards WHERE family_id = v_family_id;
    RAISE NOTICE 'Deleted rewards for family: %', v_family_id;
  END IF;
  
  -- Delete reward_redemptions
  DELETE FROM reward_redemptions WHERE user_id = v_user_id;
  
  -- Delete tasks
  DELETE FROM tasks WHERE assigned_to = v_user_id OR assigned_by = v_user_id;
  
  -- Delete notifications
  DELETE FROM notifications WHERE user_id = v_user_id;
  
  -- Delete bulletin messages
  DELETE FROM bulletin_messages WHERE sender_id = v_user_id;
  
  -- Delete user settings
  DELETE FROM user_settings WHERE user_id = v_user_id;
  
  -- Delete family if exists
  IF v_family_id IS NOT NULL THEN
    DELETE FROM families WHERE id = v_family_id;
    RAISE NOTICE 'Deleted family: %', v_family_id;
  END IF;
  
  -- Delete profile
  DELETE FROM profiles WHERE id = v_user_id;
  
  -- Delete auth user
  DELETE FROM auth.users WHERE id = v_user_id;
  
  RAISE NOTICE '✅ User 1 deleted successfully!';
END $$;


-- ============================================================================
-- STEP 3: DELETE USER 2 - Replace UUIDs below
-- ============================================================================
DO $$ 
DECLARE
  v_user_id UUID := 'USER_ID_HERE';  -- Replace with actual user ID
  v_family_id UUID;
BEGIN
  -- Get family_id
  SELECT family_id INTO v_family_id FROM profiles WHERE id = v_user_id;
  
  RAISE NOTICE 'Deleting User 2: %', v_user_id;
  
  -- Delete rewards if family exists
  IF v_family_id IS NOT NULL THEN
    DELETE FROM rewards WHERE family_id = v_family_id;
    RAISE NOTICE 'Deleted rewards for family: %', v_family_id;
  END IF;
  
  -- Delete reward_redemptions
  DELETE FROM reward_redemptions WHERE user_id = v_user_id;
  
  -- Delete tasks
  DELETE FROM tasks WHERE assigned_to = v_user_id OR assigned_by = v_user_id;
  
  -- Delete notifications
  DELETE FROM notifications WHERE user_id = v_user_id;
  
  -- Delete bulletin messages
  DELETE FROM bulletin_messages WHERE sender_id = v_user_id;
  
  -- Delete user settings
  DELETE FROM user_settings WHERE user_id = v_user_id;
  
  -- Delete family if exists
  IF v_family_id IS NOT NULL THEN
    DELETE FROM families WHERE id = v_family_id;
    RAISE NOTICE 'Deleted family: %', v_family_id;
  END IF;
  
  -- Delete profile
  DELETE FROM profiles WHERE id = v_user_id;
  
  -- Delete auth user
  DELETE FROM auth.users WHERE id = v_user_id;
  
  RAISE NOTICE '✅ User 2 deleted successfully!';
END $$;


-- ============================================================================
-- STEP 4: DELETE USER 3 - Replace UUIDs below
-- ============================================================================
DO $$ 
DECLARE
  v_user_id UUID := 'USER_ID_HERE';  -- Replace with actual user ID
  v_family_id UUID;
BEGIN
  -- Get family_id
  SELECT family_id INTO v_family_id FROM profiles WHERE id = v_user_id;
  
  RAISE NOTICE 'Deleting User 3: %', v_user_id;
  
  -- Delete rewards if family exists
  IF v_family_id IS NOT NULL THEN
    DELETE FROM rewards WHERE family_id = v_family_id;
    RAISE NOTICE 'Deleted rewards for family: %', v_family_id;
  END IF;
  
  -- Delete reward_redemptions
  DELETE FROM reward_redemptions WHERE user_id = v_user_id;
  
  -- Delete tasks
  DELETE FROM tasks WHERE assigned_to = v_user_id OR assigned_by = v_user_id;
  
  -- Delete notifications
  DELETE FROM notifications WHERE user_id = v_user_id;
  
  -- Delete bulletin messages
  DELETE FROM bulletin_messages WHERE sender_id = v_user_id;
  
  -- Delete user settings
  DELETE FROM user_settings WHERE user_id = v_user_id;
  
  -- Delete family if exists
  IF v_family_id IS NOT NULL THEN
    DELETE FROM families WHERE id = v_family_id;
    RAISE NOTICE 'Deleted family: %', v_family_id;
  END IF;
  
  -- Delete profile
  DELETE FROM profiles WHERE id = v_user_id;
  
  -- Delete auth user
  DELETE FROM auth.users WHERE id = v_user_id;
  
  RAISE NOTICE '✅ User 3 deleted successfully!';
END $$;


-- ============================================================================
-- STEP 5: VERIFY DELETION
-- ============================================================================
SELECT 
  COUNT(*) as total_users_remaining,
  'Users remaining after deletion' as note
FROM auth.users;

-- Show remaining users
SELECT 
  u.id as user_id,
  u.email,
  p.full_name,
  p.role,
  p.family_id
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
