-- ============================================================================
-- FIX: Recreate missing profiles after UUID migration
-- ============================================================================

-- STEP 1: Recreate the profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    'parent', -- Default role
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 2: Create missing profiles for existing auth users
INSERT INTO public.profiles (id, email, role, created_at)
SELECT 
  u.id,
  u.email,
  'parent' as role,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- STEP 3: Verify all users now have profiles
SELECT 
  COUNT(*) FILTER (WHERE p.id IS NOT NULL) as users_with_profiles,
  COUNT(*) FILTER (WHERE p.id IS NULL) as users_missing_profiles,
  COUNT(*) as total_auth_users
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;

-- STEP 4: Show recently created/fixed profiles
SELECT 
  p.id,
  p.email,
  p.role,
  p.family_id,
  p.created_at,
  '✅ Profile exists' as status
FROM public.profiles p
ORDER BY p.created_at DESC
LIMIT 10;
