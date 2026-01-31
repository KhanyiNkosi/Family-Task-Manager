-- database-setup.sql
-- Run this in Supabase SQL Editor

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL DEFAULT 10,
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'approved')),
  assigned_to UUID REFERENCES auth.users(id),
  family_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  family_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create claimed_rewards table
CREATE TABLE IF NOT EXISTS claimed_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_id UUID REFERENCES rewards(id),
  user_id UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied'))
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE claimed_rewards ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (assigned_to = auth.uid() OR family_id IN (
    SELECT (raw_user_meta_data->>'family_code')::TEXT 
    FROM auth.users 
    WHERE id = auth.uid()
  ));

CREATE POLICY "Parents can manage tasks"
  ON tasks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'parent'
  ));

-- Create policies for rewards
CREATE POLICY "Users can view family rewards"
  ON rewards FOR SELECT
  USING (family_id IN (
    SELECT (raw_user_meta_data->>'family_code')::TEXT 
    FROM auth.users 
    WHERE id = auth.uid()
  ));

-- Insert sample data (optional - for testing)
INSERT INTO rewards (title, description, points_required, family_id) VALUES
  ('Extra Screen Time', '30 minutes of extra video game/TV time', 50, 'demo-family'),
  ('Choose Dinner', 'Pick what the family eats for dinner', 100, 'demo-family'),
  ('Family Movie Night', 'Choose the movie for family movie night', 150, 'demo-family')
ON CONFLICT DO NOTHING;
