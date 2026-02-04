-- The user_profiles table already exists with columns: id, role, total_points
-- This script only ensures the table structure is correct and adds any missing columns

-- Add user_id column if it doesn't exist (for compatibility with new code that uses user_id)
-- Note: The existing table uses 'id' as the primary key (same as auth.users.id)
-- We'll keep using 'id' for consistency with existing data

-- Drop the helper function if it exists
DROP FUNCTION IF EXISTS is_parent_of(UUID);

-- Create helper function to check if current user is a parent of target user
CREATE OR REPLACE FUNCTION is_parent_of(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles parent_profile, profiles child_profile, user_profiles parent_up
    WHERE parent_profile.id = auth.uid()
    AND child_profile.id = target_user_id
    AND parent_profile.family_id = child_profile.family_id
    AND parent_up.id = parent_profile.id
    AND parent_up.role = 'parent'
  );
$$;
