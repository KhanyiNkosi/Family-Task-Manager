-- 1. Backfill NULLs in user_settings to defaults
UPDATE public.user_settings SET notifications = true WHERE notifications IS NULL;
UPDATE public.user_settings SET email_updates = true WHERE email_updates IS NULL;
UPDATE public.user_settings SET sound_effects = false WHERE sound_effects IS NULL;
UPDATE public.user_settings SET dark_mode = false WHERE dark_mode IS NULL;
UPDATE public.user_settings SET language = 'English' WHERE language IS NULL;
UPDATE public.user_settings SET timezone = 'UTC-5' WHERE timezone IS NULL;
UPDATE public.user_settings SET daily_reminders = true WHERE daily_reminders IS NULL;
UPDATE public.user_settings SET weekly_reports = false WHERE weekly_reports IS NULL;

-- 2. Add index on user_id (if not already PK)
CREATE UNIQUE INDEX IF NOT EXISTS user_settings_user_id_idx ON public.user_settings(user_id);

-- 3. Update RLS policies to use TO authenticated
DROP POLICY IF EXISTS "User can access own settings" ON public.user_settings;
CREATE POLICY "User can access own settings" ON public.user_settings
FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "User can update own settings" ON public.user_settings;
CREATE POLICY "User can update own settings" ON public.user_settings
FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "User can delete own settings" ON public.user_settings;
CREATE POLICY "User can delete own settings" ON public.user_settings
FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "User can insert own settings" ON public.user_settings;
CREATE POLICY "User can insert own settings" ON public.user_settings
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
