-- This SQL should be run in your Supabase SQL Editor
-- It creates a trigger to automatically create profile and user_profile entries when a user signs up

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  parent_family_id UUID;
BEGIN
  -- Insert into profiles table (with conflict handling)
  INSERT INTO public.profiles (id, email, full_name, role, family_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'child'),
    CASE
      -- If parent, generate new family_id
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'child') = 'parent' THEN gen_random_uuid()
      -- If child, use the family_code provided
      ELSE (NEW.raw_user_meta_data->>'family_code')::UUID
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

  -- Insert into user_profiles table with role and initial points (with conflict handling)
  INSERT INTO public.user_profiles (id, role, total_points)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'child'),
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires after user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view family profiles"
  ON public.profiles FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policies for user_profiles
CREATE POLICY "Users can view their own user profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view family user profiles"
  ON public.user_profiles FOR SELECT
  USING (
    id IN (
      SELECT p.id FROM public.profiles p
      WHERE p.family_id IN (
        SELECT family_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own user profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policies for tasks
CREATE POLICY "Users can view family tasks"
  ON public.tasks FOR SELECT
  USING (
    created_by IN (
      SELECT p.id FROM public.profiles p
      WHERE p.family_id IN (
        SELECT family_id FROM public.profiles WHERE id = auth.uid()
      )
    )
    OR
    assigned_to = auth.uid()
  );

CREATE POLICY "Parents can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'parent'
    )
  );

CREATE POLICY "Parents can update tasks"
  ON public.tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'parent'
    )
  );

CREATE POLICY "Parents can delete tasks"
  ON public.tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'parent'
    )
  );

CREATE POLICY "Children can update their assigned tasks"
  ON public.tasks FOR UPDATE
  USING (assigned_to = auth.uid());
