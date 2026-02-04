-- Create increment_user_points function
CREATE OR REPLACE FUNCTION increment_user_points(user_id UUID, points_to_add INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update total_points in user_profiles
  UPDATE user_profiles
  SET total_points = COALESCE(total_points, 0) + points_to_add
  WHERE id = user_id;
  
  -- If no row exists, insert one
  IF NOT FOUND THEN
    INSERT INTO user_profiles (id, total_points)
    VALUES (user_id, points_to_add)
    ON CONFLICT (id) DO UPDATE
    SET total_points = user_profiles.total_points + points_to_add;
  END IF;
END;
$$;
