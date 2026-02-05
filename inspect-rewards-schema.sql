-- Inspect the existing rewards table schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'rewards'
ORDER BY ordinal_position;

-- Check if claimed_rewards table exists and its schema
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'claimed_rewards'
ORDER BY ordinal_position;

-- List all policies that exist on rewards table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('rewards', 'reward_redemptions', 'claimed_rewards')
  AND schemaname = 'public'
ORDER BY tablename, policyname;
