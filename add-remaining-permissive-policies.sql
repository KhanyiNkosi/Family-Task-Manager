-- ============================================================================
-- Add permissive policies for remaining tables
-- ============================================================================

-- Bulletin messages (if table exists)
DROP POLICY IF EXISTS "bulletin_messages_select" ON public.bulletin_messages;

CREATE POLICY "bulletin_messages_select_all"
ON public.bulletin_messages FOR SELECT
TO authenticated
USING (true);

-- Rewards
DROP POLICY IF EXISTS "rewards_select" ON public.rewards;

CREATE POLICY "rewards_select_all"
ON public.rewards FOR SELECT
TO authenticated
USING (true);

-- Notifications
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;

CREATE POLICY "notifications_select_all"
ON public.notifications FOR SELECT
TO authenticated
USING (true);

-- Activity feed
DROP POLICY IF EXISTS "activity_feed_select" ON public.activity_feed;

CREATE POLICY "activity_feed_select_all"
ON public.activity_feed FOR SELECT
TO authenticated
USING (true);

-- User settings
DROP POLICY IF EXISTS "user_settings_select" ON public.user_settings;

CREATE POLICY "user_settings_select_all"
ON public.user_settings FOR SELECT
TO authenticated
USING (true);

SELECT '✅ Added permissive policies for all tables' as status;
