-- =====================================================
-- FIX NOTIFICATIONS RLS POLICIES
-- =====================================================
-- This fixes the RLS policies to allow family members
-- to send notifications to each other
-- =====================================================

-- Check current policies
SELECT 
  schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'notifications';

-- Drop existing policies (all possible variations)
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Family members can create notifications for each other" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Allow users to view their own notifications
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Allow family members to create notifications for each other
-- This allows children to send reminders to parents and vice versa
CREATE POLICY "Family members can create notifications for each other"
ON notifications FOR INSERT
WITH CHECK (
  -- Check if the sender (authenticated user) is in the same family as the recipient
  EXISTS (
    SELECT 1 FROM profiles sender
    WHERE sender.id = auth.uid()
    AND sender.family_id = (
      SELECT family_id FROM profiles recipient
      WHERE recipient.id = notifications.user_id
    )
  )
);

-- Allow users to update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON notifications FOR DELETE
USING (auth.uid() = user_id);

-- Verify new policies
SELECT 
  policyname, cmd, 
  CASE 
    WHEN cmd = 'SELECT' THEN 'View own'
    WHEN cmd = 'INSERT' THEN 'Family can send'
    WHEN cmd = 'UPDATE' THEN 'Update own'
    WHEN cmd = 'DELETE' THEN 'Delete own'
  END as description
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY cmd;
