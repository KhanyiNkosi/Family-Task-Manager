-- Fix Support Tickets RLS Policies
-- Run this in Supabase SQL Editor

-- First, let's check if the table exists and has the right structure
DO $$ 
BEGIN
  -- Add ticket_number column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'support_tickets' AND column_name = 'ticket_number'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN ticket_number SERIAL;
    RAISE NOTICE 'Added ticket_number column';
  END IF;
END $$;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Anyone can create support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Parents can view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Parents can update tickets" ON support_tickets;

-- Enable Row Level Security (if not already)
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone (even anonymous users) can INSERT support tickets
CREATE POLICY "Anyone can create support tickets"
  ON support_tickets FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy 2: Users can view their own tickets by email
CREATE POLICY "Users can view own tickets by email"
  ON support_tickets FOR SELECT
  TO anon, authenticated
  USING (email = auth.email()::text OR user_id = auth.uid());

-- Policy 3: Authenticated parents can view all tickets (admin)
CREATE POLICY "Parents can view all tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'parent'
    )
  );

-- Policy 4: Parents can update tickets (admin)
CREATE POLICY "Parents can update tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'parent'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'parent'
    )
  );

-- Ensure anonymous users have INSERT permission
GRANT INSERT ON support_tickets TO anon;
GRANT SELECT, INSERT ON support_tickets TO authenticated;

-- Verify policies were created
SELECT 
    schemaname, 
    tablename, 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'support_tickets'
ORDER BY policyname;

-- Test the setup
SELECT 
    'Table exists' as check_type,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_name = 'support_tickets'

UNION ALL

SELECT 
    'Policies created' as check_type,
    COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'support_tickets'

UNION ALL

SELECT 
    'Columns present' as check_type,
    COUNT(*) as count
FROM information_schema.columns 
WHERE table_name = 'support_tickets';
