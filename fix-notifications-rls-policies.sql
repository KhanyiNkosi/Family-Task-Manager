-- FIX NOTIFICATIONS RLS POLICIES
-- Issue: Children need to insert notifications for parents (reward suggestions)
--        Parents need to select their own notifications
--        Current policies may be too restrictive

-- Drop existing restrictive policies (both old and new names)
DROP POLICY IF EXISTS notifications_select_policy ON notifications;
DROP POLICY IF EXISTS notifications_insert_policy ON notifications;
DROP POLICY IF EXISTS notifications_update_policy ON notifications;
DROP POLICY IF EXISTS notifications_delete_policy ON notifications;
DROP POLICY IF EXISTS notifications_select_own ON notifications;
DROP POLICY IF EXISTS notifications_insert_family ON notifications;
DROP POLICY IF EXISTS notifications_update_own ON notifications;
DROP POLICY IF EXISTS notifications_delete_own ON notifications;

-- Enable RLS (if not already enabled)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can see their OWN notifications
CREATE POLICY notifications_select_own ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Allow users to create notifications for FAMILY MEMBERS
-- This is critical for child → parent suggestions
CREATE POLICY notifications_insert_family ON notifications
  FOR INSERT
  WITH CHECK (
    -- User can insert if the target user (user_id) is in the same family
    EXISTS (
      SELECT 1 FROM profiles sender
      JOIN profiles receiver ON sender.family_id = receiver.family_id
      WHERE sender.id = auth.uid()
        AND receiver.id = notifications.user_id
        AND sender.family_id IS NOT NULL
    )
  );

-- UPDATE: Users can update their OWN notifications (mark as read)
CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their OWN notifications
CREATE POLICY notifications_delete_own ON notifications
  FOR DELETE
  USING (user_id = auth.uid());

-- Verify policies are created
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_status,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_status
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY cmd, policyname;

-- Test: Check if notifications exist for parents
SELECT 
  n.id,
  n.user_id,
  p.full_name as recipient_name,
  p.role as recipient_role,
  n.title,
  n.action_url,
  n.read,
  n.created_at
FROM notifications n
JOIN profiles p ON n.user_id = p.id
WHERE p.role = 'parent'
ORDER BY n.created_at DESC
LIMIT 10;
