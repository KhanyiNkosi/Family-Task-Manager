-- Add policy to allow parents to view their children's profiles
-- Use a helper function to avoid recursion

-- First, create a helper function that gets family_id from auth.uid() using SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_current_user_family_id()
RETURNS UUID AS $$
  SELECT family_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Now create policy using the function (no recursion!)
CREATE POLICY "allow_select_family_profiles" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING (
    family_id IS NOT NULL 
    AND family_id = get_current_user_family_id()
  );
