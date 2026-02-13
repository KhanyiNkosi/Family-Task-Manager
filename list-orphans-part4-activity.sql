-- ============================================================================
-- SAFE ORPHAN LISTING - Part 4: Activity Feed Impact
-- ============================================================================

SELECT 
  p.family_id::text as missing_family_id,
  COUNT(DISTINCT af.id) as activity_feed_count,
  MIN(af.created_at) as earliest_activity,
  MAX(af.created_at) as latest_activity,
  COUNT(CASE WHEN af.action_type = 'task_completed' THEN 1 END) as task_completions,
  COUNT(CASE WHEN af.action_type = 'task_created' THEN 1 END) as task_creations
FROM profiles p
LEFT JOIN activity_feed af ON af.family_id::text = p.family_id::text
WHERE p.family_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM families f 
    WHERE f.id::text = p.family_id::text
  )
GROUP BY p.family_id::text
ORDER BY activity_feed_count DESC;
