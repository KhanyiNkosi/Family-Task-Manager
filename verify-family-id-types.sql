-- Verify profiles.family_id is TEXT (it should be after previous migration)
SELECT 
  table_name,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name = 'family_id';

-- Verify bulletin_messages.family_id is TEXT
SELECT 
  table_name,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'bulletin_messages' 
  AND column_name = 'family_id';

-- Check all current RLS policies on bulletin_messages
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'bulletin_messages'
ORDER BY cmd, policyname;
