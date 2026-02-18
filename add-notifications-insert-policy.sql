-- ============================================================================
-- Add missing INSERT/UPDATE policies for child actions
-- ============================================================================

-- Notifications: Allow family members to INSERT (for reward suggestions)
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;

CREATE POLICY "notifications_insert_family"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
  family_id IN (
    SELECT family_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Allow users to update their own notifications (mark as read)
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;

CREATE POLICY "notifications_update_own"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

SELECT '✅ Notifications policies added - test reward suggestion now' as status;
