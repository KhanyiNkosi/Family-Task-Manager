-- Fix infinite recursion by using only non-recursive policies

-- Drop ALL existing policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view family profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view family member profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "view_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "view_family_profiles" ON public.profiles;
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create ONLY the simple policy - no recursion
CREATE POLICY "view_own_profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "update_own_profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);
