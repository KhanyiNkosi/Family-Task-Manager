-- Inspect family_id column types across tables
-- This will show us the exact data types causing the mismatch

SELECT 
  table_name,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name IN ('family_id', 'id')
AND table_name IN ('families', 'profiles', 'activity_feed')
ORDER BY table_name, column_name;

-- Also check what families.id actually is
SELECT 
  'families.id' as column_ref,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'families'
AND column_name = 'id';

-- Check profiles.family_id
SELECT 
  'profiles.family_id' as column_ref,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
AND column_name = 'family_id';
