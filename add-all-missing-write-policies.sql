-- ============================================================================
-- Add ALL missing policies for reward redemptions and other tables
-- ============================================================================

-- REWARD_REDEMPTIONS: Critical for redeeming rewards
-- SELECT: View own redemptions and family redemptions
DROP POLICY IF EXISTS "reward_redemptions_select" ON public.reward_redemptions;
DROP POLICY IF EXISTS "reward_redemptions_select_all" ON public.reward_redemptions;

CREATE POLICY "reward_redemptions_select_all"
ON public.reward_redemptions FOR SELECT
TO authenticated
USING (true);  -- Permissive for now

-- INSERT: Allow family members to redeem rewards
DROP POLICY IF EXISTS "reward_redemptions_insert" ON public.reward_redemptions;

CREATE POLICY "reward_redemptions_insert_family"
ON public.reward_redemptions FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND family_id IN (
      SELECT family_id FROM public.rewards WHERE id = reward_redemptions.reward_id
    )
  )
);

-- UPDATE: Parents can approve/reject redemptions
DROP POLICY IF EXISTS "reward_redemptions_update" ON public.reward_redemptions;

CREATE POLICY "reward_redemptions_update_family"
ON public.reward_redemptions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'parent'
    AND family_id IN (
      SELECT family_id FROM public.profiles WHERE id = reward_redemptions.user_id
    )
  )
);

-- BULLETIN_MESSAGES: Allow parents to create/update
DROP POLICY IF EXISTS "bulletin_messages_insert" ON public.bulletin_messages;

CREATE POLICY "bulletin_messages_insert_family"
ON public.bulletin_messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'parent'
    AND family_id = bulletin_messages.family_id
  )
);

DROP POLICY IF EXISTS "bulletin_messages_update" ON public.bulletin_messages;

CREATE POLICY "bulletin_messages_update_family"
ON public.bulletin_messages FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'parent'
    AND family_id = bulletin_messages.family_id
  )
);

DROP POLICY IF EXISTS "bulletin_messages_delete" ON public.bulletin_messages;

CREATE POLICY "bulletin_messages_delete_family"
ON public.bulletin_messages FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'parent'
    AND family_id = bulletin_messages.family_id
  )
);

-- USER_SETTINGS: Allow users to update their own settings
DROP POLICY IF EXISTS "user_settings_insert" ON public.user_settings;

CREATE POLICY "user_settings_insert_own"
ON public.user_settings FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_settings_update" ON public.user_settings;

CREATE POLICY "user_settings_update_own"
ON public.user_settings FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

SELECT '✅ All missing write policies added!' as status;
