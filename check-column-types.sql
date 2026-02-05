-- Query to check the data types of columns used in policies
SELECT 
  table_name,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'user_profiles', 'rewards', 'reward_redemptions')
  AND column_name IN ('id', 'family_id', 'role', 'user_id', 'created_by')
ORDER BY table_name, column_name;
