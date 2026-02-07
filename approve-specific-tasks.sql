-- ============================================================================
-- APPROVE SPECIFIC TASKS
-- Approves the 2 completed tasks that are still showing on child dashboard
-- ============================================================================

-- Approve the 2 specific tasks
UPDATE tasks
SET approved = true
WHERE id IN (
  '73cd88b2-1fc4-4cb2-987e-ee8d399b7a34',  -- Home Work
  'a5628e94-6140-4553-b406-fb95ec15130b'   -- Walk dog
);

-- Verify they're now approved
SELECT 
  id,
  title,
  completed,
  approved,
  completed_at
FROM tasks
WHERE id IN (
  '73cd88b2-1fc4-4cb2-987e-ee8d399b7a34',
  'a5628e94-6140-4553-b406-fb95ec15130b'
);

-- Show success message
DO $$
BEGIN
  RAISE NOTICE '✅ Tasks approved successfully!';
  RAISE NOTICE '   The 2 tasks should now disappear from the child dashboard.';
  RAISE NOTICE '   Refresh the child dashboard to see the change.';
END $$;
