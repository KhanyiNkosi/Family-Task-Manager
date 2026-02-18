-- CHECK ACTIVITY REACTIONS AND COMMENTS SETUP
-- Diagnose why reactions and comments don't work

-- 1. Check if tables exist
SELECT 
  tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('activity_reactions', 'activity_comments')
ORDER BY tablename;

-- 2. Check activity_reactions schema
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'activity_reactions'
ORDER BY ordinal_position;

-- 3. Check activity_comments schema
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'activity_comments'
ORDER BY ordinal_position;

-- 4. Check RLS policies on activity_reactions
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'activity_reactions'
ORDER BY cmd, policyname;

-- 5. Check RLS policies on activity_comments
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'activity_comments'
ORDER BY cmd, policyname;

-- 6. Test: Check if any reactions exist
SELECT COUNT(*) as total_reactions FROM activity_reactions;

-- 7. Test: Check if any comments exist
SELECT COUNT(*) as total_comments FROM activity_comments;

-- 8. Check foreign key constraints
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('activity_reactions', 'activity_comments')
  AND tc.constraint_type = 'FOREIGN KEY';
