-- ============================================================================
-- VERIFY NOTIFICATION TRIGGERS
-- Run this in Supabase SQL Editor to check if triggers are installed
-- ============================================================================

-- Check all triggers on tasks table
SELECT 
  tgname AS trigger_name,
  proname AS function_name,
  tgenabled AS enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'tasks'::regclass
  AND tgname LIKE '%notification%'
ORDER BY tgname;

-- Check all triggers on reward_redemptions table
SELECT 
  tgname AS trigger_name,
  proname AS function_name,
  tgenabled AS enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'reward_redemptions'::regclass
  AND tgname LIKE '%notification%'
ORDER BY tgname;

-- Check if trigger functions exist
SELECT 
  proname AS function_name,
  prosrc AS function_body_preview
FROM pg_proc
WHERE proname LIKE 'notify_%'
ORDER BY proname;

-- Expected output:
-- ✅ 4 triggers on tasks table:
--    - task_completed_notification
--    - task_approved_notification  
--    - task_assigned_notification
--    - help_requested_notification
-- ✅ 2 triggers on reward_redemptions table:
--    - reward_requested_notification
--    - reward_status_notification
-- ✅ 6 functions starting with notify_
