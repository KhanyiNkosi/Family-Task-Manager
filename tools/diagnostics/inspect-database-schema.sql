-- Comprehensive Schema Inspection for FamilyTask Database
-- Run this in Supabase SQL Editor (non-destructive, read-only)
-- This will show all tables, columns, and constraints we need to verify

-- ============================================================================
-- 1. LIST ALL TABLES IN PUBLIC SCHEMA
-- ============================================================================
SELECT 
  '=== PUBLIC TABLES ===' as info,
  tablename as table_name,
  schemaname as schema_name
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 2. CHECK PROFILES TABLE SCHEMA
-- ============================================================================
SELECT 
  '=== PROFILES COLUMNS ===' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================================================
-- 3. CHECK TASKS TABLE SCHEMA
-- ============================================================================
SELECT 
  '=== TASKS COLUMNS ===' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tasks'
ORDER BY ordinal_position;

-- ============================================================================
-- 4. CHECK FAMILIES TABLE SCHEMA (if exists)
-- ============================================================================
SELECT 
  '=== FAMILIES COLUMNS ===' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'families'
ORDER BY ordinal_position;

-- ============================================================================
-- 5. CHECK REWARDS TABLE SCHEMA
-- ============================================================================
SELECT 
  '=== REWARDS COLUMNS ===' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'rewards'
ORDER BY ordinal_position;

-- ============================================================================
-- 6. CHECK REWARD_REDEMPTIONS TABLE SCHEMA
-- ============================================================================
SELECT 
  '=== REWARD_REDEMPTIONS COLUMNS ===' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'reward_redemptions'
ORDER BY ordinal_position;

-- ============================================================================
-- 7. CHECK SUPPORT_TICKETS TABLE SCHEMA
-- ============================================================================
SELECT 
  '=== SUPPORT_TICKETS COLUMNS ===' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'support_tickets'
ORDER BY ordinal_position;

-- ============================================================================
-- 8. CHECK FOR EXISTING GAMIFICATION TABLES
-- ============================================================================
SELECT 
  '=== EXISTING GAMIFICATION TABLES ===' as info,
  tablename
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('achievements', 'user_achievements', 'user_streaks', 'user_levels')
ORDER BY tablename;

-- ============================================================================
-- 9. CHECK FOR EXISTING ACTIVITY FEED TABLES
-- ============================================================================
SELECT 
  '=== EXISTING ACTIVITY FEED TABLES ===' as info,
  tablename
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('activity_feed', 'activity_reactions', 'activity_comments')
ORDER BY tablename;

-- ============================================================================
-- 10. CHECK STORAGE BUCKETS
-- ============================================================================
SELECT 
  '=== STORAGE BUCKETS ===' as info,
  id,
  name,
  public
FROM storage.buckets
ORDER BY name;

-- ============================================================================
-- 11. CHECK FOREIGN KEY RELATIONSHIPS
-- ============================================================================
SELECT 
  '=== FOREIGN KEY CONSTRAINTS ===' as info,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('profiles', 'tasks', 'rewards', 'reward_redemptions', 'support_tickets')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 12. SUMMARY
-- ============================================================================
SELECT 
  '=== SCHEMA INSPECTION COMPLETE ===' as summary,
  'Review the results above to verify:' as step_1,
  '1. profiles table has: id, full_name, role, family_id' as check_1,
  '2. tasks table has: id, assigned_to, completed, approved' as check_2,
  '3. families table exists (needed for activity feed)' as check_3,
  '4. No conflicting gamification/activity tables exist' as check_4;

-- ============================================================================
-- NOTES
-- ============================================================================
-- After running this, check the results and confirm:
-- 
-- ✓ Column name matches (e.g., is it 'assigned_to' or 'assignee_id'?)
-- ✓ Do families table exist? If not, we need to create it.
-- ✓ Are there existing gamification tables we might conflict with?
-- ✓ Is there a 'task-photos' storage bucket already?
-- 
-- Then I can adjust the migration SQL files to match your exact schema.
