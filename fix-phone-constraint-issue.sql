-- ============================================================================
-- FIX: Phone Constraint Blocking Profile Creation
-- ============================================================================
-- Issue: profiles_phone_not_empty constraint requires phone to be NULL or non-empty
-- But handle_new_user() doesn't set phone, and column might default to ''
-- ============================================================================

-- Step 1: Ensure phone column default is NULL (not empty string)
ALTER TABLE profiles 
ALTER COLUMN phone SET DEFAULT NULL;

-- Step 2: Update handle_new_user() to explicitly set phone = NULL
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, phone, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    'parent', -- Default role
    NULL,     -- Explicitly set phone to NULL
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Clean up any existing empty string phone values
UPDATE profiles
SET phone = NULL
WHERE phone = '';

-- Verification
SELECT 
  'Constraint Definition' as check_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
  AND conname = 'profiles_phone_not_empty';

SELECT 
  'Column Default' as check_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name = 'phone';

SELECT 
  'Empty Phone Check' as check_type,
  COUNT(*) as count_with_empty_phone
FROM profiles
WHERE phone = '';
