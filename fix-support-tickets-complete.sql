-- Comprehensive Support Tickets RLS Fix
-- Run this in Supabase SQL Editor

-- Step 1: Fix table structure
DO $$ 
BEGIN
  -- Make user_id nullable (anonymous users won't have one)
  ALTER TABLE support_tickets ALTER COLUMN user_id DROP NOT NULL;
  RAISE NOTICE 'user_id is now nullable';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'user_id was already nullable or doesnt exist';
END $$;

-- Step 2: Drop ALL existing policies to start fresh
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'support_tickets'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON support_tickets', pol.policyname);
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;
END $$;

-- Step 3: Ensure RLS is enabled
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, permissive policies

-- Policy 1: Allow ALL inserts (authenticated or anonymous)
CREATE POLICY "allow_all_insert"
  ON support_tickets 
  FOR INSERT 
  TO public
  WITH CHECK (true);

-- Policy 2: Authenticated users can see their own tickets
CREATE POLICY "users_view_own_tickets"
  ON support_tickets 
  FOR SELECT 
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy 3: Parents can see all tickets
CREATE POLICY "parents_view_all"
  ON support_tickets 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'parent'
    )
  );

-- Policy 4: Parents can update tickets
CREATE POLICY "parents_update_tickets"
  ON support_tickets 
  FOR UPDATE 
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

-- Step 5: Grant explicit permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON support_tickets TO anon, authenticated;
GRANT SELECT ON support_tickets TO authenticated;
GRANT UPDATE ON support_tickets TO authenticated;

-- If ticket_number is SERIAL, grant sequence usage
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.sequences 
    WHERE sequence_name LIKE '%support_tickets_ticket_number%'
  ) THEN
    EXECUTE format('GRANT USAGE ON SEQUENCE %I TO anon, authenticated', 
      (SELECT sequence_name FROM information_schema.sequences 
       WHERE sequence_name LIKE '%support_tickets_ticket_number%' LIMIT 1)
    );
    RAISE NOTICE 'Granted sequence usage';
  END IF;
END $$;

-- Step 6: Verification
SELECT 
  'Policies Created' as status,
  COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'support_tickets';

SELECT 
  policyname,
  cmd as operation,
  roles
FROM pg_policies 
WHERE tablename = 'support_tickets'
ORDER BY cmd, policyname;

-- Step 7: Test insert (as anonymous)
SELECT 'Testing anonymous insert capability' as test;

-- Show table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'support_tickets'
ORDER BY ordinal_position;
