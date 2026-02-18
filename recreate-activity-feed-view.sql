-- RECREATE ACTIVITY_FEED_WITH_STATS VIEW
-- This view was missing after UUID migration, causing activity feed page to be empty

DROP VIEW IF EXISTS activity_feed_with_stats;

CREATE VIEW activity_feed_with_stats AS
SELECT 
  af.*,
  p.full_name as user_name,
  p.role as user_role,
  COALESCE(reaction_counts.total_reactions, 0) as reaction_count,
  COALESCE(comment_counts.total_comments, 0) as comment_count
FROM activity_feed af
JOIN profiles p ON p.id = af.user_id
LEFT JOIN (
  SELECT activity_id, COUNT(*) as total_reactions
  FROM activity_reactions
  GROUP BY activity_id
) reaction_counts ON reaction_counts.activity_id = af.id
LEFT JOIN (
  SELECT activity_id, COUNT(*) as total_comments
  FROM activity_comments
  GROUP BY activity_id
) comment_counts ON comment_counts.activity_id = af.id
ORDER BY af.is_pinned DESC, af.created_at DESC;

-- Grant access to view
GRANT SELECT ON activity_feed_with_stats TO authenticated;

-- Verify view was created
SELECT 
  viewname,
  definition
FROM pg_views
WHERE viewname = 'activity_feed_with_stats';

-- Test query: Check if approved tasks now appear
SELECT COUNT(*) as total_entries
FROM activity_feed_with_stats
WHERE activity_type = 'task_approved';
