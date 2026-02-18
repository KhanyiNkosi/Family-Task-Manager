-- ============================================================================
-- ULTIMATE FIX: Drop the problematic constraint and use a trigger instead
-- ============================================================================
-- This converts empty phone strings to NULL automatically before insert/update
-- ============================================================================

-- Step 1: Drop the problematic constraint
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_phone_not_empty;

-- Step 2: Create a trigger that auto-converts empty strings to NULL
CREATE OR REPLACE FUNCTION clean_phone_value()
RETURNS TRIGGER AS $$
BEGIN
  -- If phone is an empty string, set it to NULL
  IF NEW.phone = '' THEN
    NEW.phone := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger (runs BEFORE insert or update)
DROP TRIGGER IF EXISTS clean_phone_trigger ON profiles;
CREATE TRIGGER clean_phone_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION clean_phone_value();

-- Step 3: Clean up existing empty strings
UPDATE profiles
SET phone = NULL
WHERE phone = '';

-- Verification
SELECT 
  'Trigger Created' as status,
  tgname as trigger_name
FROM pg_trigger
WHERE tgname = 'clean_phone_trigger';

SELECT 
  'Empty Phones' as check_type,
  COUNT(*) as count
FROM profiles
WHERE phone = '';
