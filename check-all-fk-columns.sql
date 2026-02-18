-- ============================================================================
-- Check which tables have created_by column
-- ============================================================================

SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('created_by', 'family_id', 'assigned_to')
  AND table_name IN ('tasks', 'bulletin_messages', 'rewards', 'notifications', 'activity_feed')
ORDER BY table_name, column_name;
