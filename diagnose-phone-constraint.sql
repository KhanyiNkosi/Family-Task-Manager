-- Check the profiles_phone_unique constraint
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
  AND conname LIKE '%phone%';

-- Check for duplicate phone values including NULL/empty
SELECT 
  phone,
  COUNT(*) as count,
  array_agg(id) as profile_ids
FROM profiles
GROUP BY phone
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Check if phone column allows NULL
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name = 'phone';
