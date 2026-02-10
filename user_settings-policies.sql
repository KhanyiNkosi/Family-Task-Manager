-- Enable RLS and add policies for user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow users to select/update/delete their own settings
CREATE POLICY "User can access own settings" ON public.user_settings
FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "User can update own settings" ON public.user_settings
FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "User can delete own settings" ON public.user_settings
FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "User can insert own settings" ON public.user_settings
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Insert default settings row for new users
CREATE OR REPLACE FUNCTION insert_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS insert_default_user_settings ON public.profiles;
CREATE TRIGGER insert_default_user_settings
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION insert_default_user_settings();
