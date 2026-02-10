-- Create user_settings table for storing notification/display preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  notifications boolean DEFAULT true,
  email_updates boolean DEFAULT true,
  sound_effects boolean DEFAULT false,
  dark_mode boolean DEFAULT false,
  language text DEFAULT 'English',
  timezone text DEFAULT 'UTC-5',
  daily_reminders boolean DEFAULT true,
  weekly_reports boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
-- Add trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_user_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_settings_updated_at ON public.user_settings;
CREATE TRIGGER user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW EXECUTE FUNCTION update_user_settings_timestamp();
