-- ============================================================================
-- STEP-BY-STEP MANUAL MIGRATION: Family_ID UUID → TEXT
-- ============================================================================
-- Execute each section INDIVIDUALLY in Supabase SQL Editor
-- Review output after EACH step before proceeding to the next
-- ============================================================================

-- ============================================================================
-- STEP 0: BACKUP POLICY DEFINITIONS (RUN THIS FIRST!)
-- ============================================================================
-- This saves all policy definitions so you can recreate them manually if needed

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check,
  -- Reconstruct policy creation statement
  format(
    'CREATE POLICY %I ON %I.%I FOR %s TO %s USING (%s)%s;',
    policyname,
    schemaname,
    tablename,
    cmd,
    array_to_string(roles, ', '),
    COALESCE(qual, 'true'),
    CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')' ELSE '' END
  ) as recreate_statement
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
  AND (
    qual ILIKE '%family%'
    OR with_check ILIKE '%family%'
    OR tablename IN ('profiles', 'families', 'activity_feed', 'tasks', 'bulletin_messages', 
                     'rewards', 'reward_redemptions', 'user_profiles', 'user_achievements',
                     'user_streaks', 'activity_reactions', 'activity_comments')
  )
ORDER BY schemaname, tablename, policyname;

-- SAVE THE OUTPUT ABOVE TO A TEXT FILE!
-- You'll need these to recreate policies after migration

-- ============================================================================
-- STEP 1: LIST ALL TABLES WITH FAMILY_ID (DISCOVERY)
-- ============================================================================
-- Review this list - these are ALL tables that will be affected

SELECT 
  table_name,
  column_name,
  data_type,
  CASE 
    WHEN data_type = 'uuid' THEN '🔴 NEEDS CONVERSION'
    WHEN data_type = 'text' THEN '✅ ALREADY TEXT'
    ELSE '⚠️ UNEXPECTED TYPE'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    column_name LIKE '%family%'
    OR (table_name = 'families' AND column_name = 'id')
  )
ORDER BY 
  CASE WHEN data_type = 'uuid' THEN 1 ELSE 2 END,
  table_name,
  column_name;

-- ============================================================================
-- STEP 2: DROP ALL FOREIGN KEY CONSTRAINTS
-- ============================================================================
-- Run this to generate DROP statements, then execute them

SELECT 
  format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I;', 
    tc.table_name, 
    tc.constraint_name
  ) as drop_statement
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND kcu.column_name LIKE '%family%'
ORDER BY tc.table_name;

-- Copy the output statements above and execute them

-- ============================================================================
-- STEP 3: DROP ALL POLICIES ON AFFECTED TABLES
-- ============================================================================
-- Generate DROP POLICY statements for all affected tables

-- Drop policies on public tables
SELECT 
  format('DROP POLICY IF EXISTS %I ON %I.%I;', 
    policyname,
    schemaname,
    tablename
  ) as drop_statement
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name LIKE '%family%'
  )
ORDER BY schemaname, tablename, policyname;

-- Drop policies on storage.objects that reference family
SELECT 
  format('DROP POLICY IF EXISTS %I ON storage.objects;', policyname) as drop_statement
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (qual ILIKE '%family%' OR with_check ILIKE '%family%')
ORDER BY policyname;

-- Copy and execute ALL drop statements above

-- ============================================================================
-- STEP 4: DROP INDEXES ON FAMILY_ID COLUMNS
-- ============================================================================

-- Generate DROP INDEX statements
SELECT 
  format('DROP INDEX IF EXISTS %I;', indexname) as drop_statement
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%family%'
ORDER BY indexname;

-- Copy and execute the drop statements

-- ============================================================================
-- STEP 5: CONVERT ALL FAMILY_ID COLUMNS TO TEXT
-- ============================================================================
-- Generate ALTER TABLE statements for each UUID column

SELECT 
  format(
    'ALTER TABLE %I ALTER COLUMN %I TYPE TEXT USING %I::TEXT;',
    table_name,
    column_name,
    column_name
  ) as alter_statement,
  table_name,
  column_name,
  data_type as current_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    column_name LIKE '%family%'
    OR (table_name = 'families' AND column_name = 'id')
  )
  AND data_type = 'uuid'
ORDER BY 
  -- Convert families.id last if it exists
  CASE WHEN table_name = 'families' AND column_name = 'id' THEN 999 ELSE 1 END,
  table_name;

-- Copy and execute EACH alter statement ONE AT A TIME
-- Check for errors after each one

-- ============================================================================
-- STEP 6: VERIFY TYPE CONVERSION
-- ============================================================================

SELECT 
  table_name,
  column_name,
  data_type,
  CASE 
    WHEN data_type = 'text' THEN '✅ SUCCESS'
    WHEN data_type = 'uuid' THEN '❌ STILL UUID - CONVERSION FAILED'
    ELSE '⚠️ UNEXPECTED: ' || data_type
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    column_name LIKE '%family%'
    OR (table_name = 'families' AND column_name = 'id')
  )
ORDER BY table_name, column_name;

-- ALL should show '✅ SUCCESS' before proceeding!

-- ============================================================================
-- STEP 7: RECREATE POLICIES (USE SAVED DEFINITIONS FROM STEP 0)
-- ============================================================================
-- Go back to your saved policy definitions from STEP 0
-- Recreate each policy manually, ensuring TEXT comparisons
-- Test each policy after creation

-- Example policy pattern (adjust for your specific policies):
/*
CREATE POLICY "profiles_select_family" ON profiles
  FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );
*/

-- ============================================================================
-- STEP 8: RECREATE FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- profiles → families
ALTER TABLE profiles
  ADD CONSTRAINT profiles_family_id_fkey 
  FOREIGN KEY (family_id) 
  REFERENCES families(id) 
  ON DELETE SET NULL;

-- activity_feed → families
ALTER TABLE activity_feed
  ADD CONSTRAINT activity_feed_family_id_fkey 
  FOREIGN KEY (family_id) 
  REFERENCES families(id) 
  ON DELETE CASCADE;

-- Add other FK constraints as discovered in STEP 2
-- (tasks, bulletin_messages, rewards, etc.)

-- ============================================================================
-- STEP 9: RECREATE INDEXES
-- ============================================================================

CREATE INDEX idx_families_id ON families(id);
CREATE INDEX idx_profiles_family_id ON profiles(family_id);
CREATE INDEX idx_activity_feed_family_id ON activity_feed(family_id);
CREATE INDEX idx_tasks_family_id ON tasks(family_id);

-- Add indexes for other tables as discovered in STEP 4

-- ============================================================================
-- STEP 10: FINAL VERIFICATION
-- ============================================================================

-- Check types are all TEXT
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (column_name LIKE '%family%' OR (table_name = 'families' AND column_name = 'id'))
ORDER BY table_name;

-- Check no orphaned profiles
SELECT COUNT(*) as orphan_count
FROM profiles p
WHERE p.family_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM families f WHERE f.id = p.family_id);
-- Should return 0

-- Check FK constraints exist
SELECT 
  tc.table_name,
  tc.constraint_name,
  kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND kcu.column_name LIKE '%family%'
ORDER BY tc.table_name;

-- Check policies exist
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
  AND tablename IN ('profiles', 'families', 'activity_feed', 'tasks', 'objects')
GROUP BY schemaname, tablename
ORDER BY schemaname, tablename;

-- ============================================================================
-- DONE! Test the application with real users
-- ============================================================================
