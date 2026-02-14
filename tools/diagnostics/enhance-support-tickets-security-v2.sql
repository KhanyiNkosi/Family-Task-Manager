-- Enhance support_tickets table with better security and ticket numbering
-- VERSION 2: Safely drops existing policies before recreating
-- Run this in Supabase SQL Editor

-- ============================================================================
-- 1. ADD MISSING COLUMNS (if they don't exist)
-- ============================================================================

-- Add name column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'support_tickets' AND column_name = 'name'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN name TEXT;
    RAISE NOTICE 'Added column: name';
  ELSE
    RAISE NOTICE 'Column name already exists';
  END IF;
END $$;

-- Add email column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'support_tickets' AND column_name = 'email'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN email TEXT;
    RAISE NOTICE 'Added column: email';
  ELSE
    RAISE NOTICE 'Column email already exists';
  END IF;
END $$;

-- Add category column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'support_tickets' AND column_name = 'category'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN category TEXT DEFAULT 'general';
    RAISE NOTICE 'Added column: category';
  ELSE
    RAISE NOTICE 'Column category already exists';
  END IF;
END $$;

-- Add message column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'support_tickets' AND column_name = 'message'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN message TEXT;
    RAISE NOTICE 'Added column: message';
  ELSE
    RAISE NOTICE 'Column message already exists';
  END IF;
END $$;

-- Add status column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'support_tickets' AND column_name = 'status'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN status TEXT DEFAULT 'open';
    RAISE NOTICE 'Added column: status';
  ELSE
    RAISE NOTICE 'Column status already exists';
  END IF;
END $$;

-- Add priority column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'support_tickets' AND column_name = 'priority'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN priority TEXT DEFAULT 'normal';
    RAISE NOTICE 'Added column: priority';
  ELSE
    RAISE NOTICE 'Column priority already exists';
  END IF;
END $$;

-- Add assignee_id column if missing (this is the correct column name based on inspection)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'support_tickets' AND column_name = 'assignee_id'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN assignee_id UUID REFERENCES auth.users(id);
    RAISE NOTICE 'Added column: assignee_id';
  ELSE
    RAISE NOTICE 'Column assignee_id already exists';
  END IF;
END $$;

-- Add user_id column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'support_tickets' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN user_id UUID REFERENCES auth.users(id);
    RAISE NOTICE 'Added column: user_id';
  ELSE
    RAISE NOTICE 'Column user_id already exists';
  END IF;
END $$;

-- Add resolved_at column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'support_tickets' AND column_name = 'resolved_at'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN resolved_at TIMESTAMPTZ;
    RAISE NOTICE 'Added column: resolved_at';
  ELSE
    RAISE NOTICE 'Column resolved_at already exists';
  END IF;
END $$;

-- Add admin_notes column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'support_tickets' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN admin_notes TEXT;
    RAISE NOTICE 'Added column: admin_notes';
  ELSE
    RAISE NOTICE 'Column admin_notes already exists';
  END IF;
END $$;

-- ============================================================================
-- 2. ADD TICKET NUMBERING
-- ============================================================================

-- Add ticket_number column
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS ticket_number INTEGER;

-- Create sequence for ticket numbers
CREATE SEQUENCE IF NOT EXISTS support_ticket_number_seq START WITH 1000;

-- Function to auto-assign ticket numbers
CREATE OR REPLACE FUNCTION assign_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number = nextval('support_ticket_number_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-numbering
DROP TRIGGER IF EXISTS assign_ticket_number_trigger ON support_tickets;
CREATE TRIGGER assign_ticket_number_trigger
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION assign_ticket_number();

-- ============================================================================
-- 3. ADD INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_number ON support_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assignee_id ON support_tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_email ON support_tickets(email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);

-- ============================================================================
-- 4. REVOKE WIDE PERMISSIONS & GRANT MINIMAL
-- ============================================================================

REVOKE ALL ON support_tickets FROM anon;
GRANT INSERT ON support_tickets TO anon;

-- ============================================================================
-- 5. DROP OLD POLICIES (safely)
-- ============================================================================

DROP POLICY IF EXISTS "Allow ticket creation" ON support_tickets;
DROP POLICY IF EXISTS "Anyone can create support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users view own tickets by email" ON support_tickets;
DROP POLICY IF EXISTS "Parents can view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Parents can update tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins update tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins delete tickets" ON support_tickets;

-- ============================================================================
-- 6. CREATE NEW TIGHT RLS POLICIES
-- ============================================================================

-- Policy: Anyone (including logged-out users) can create tickets
CREATE POLICY "Allow ticket creation"
  ON support_tickets FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can view their own tickets (by email match)
CREATE POLICY "Users view own tickets by email"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    email = auth.jwt()->>'email'
    OR user_id = auth.uid()
  );

-- Policy: Parents (admins) can view ALL tickets
CREATE POLICY "Admins view all tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'parent'
    )
  );

-- Policy: Parents (admins) can update any ticket without restrictions
CREATE POLICY "Admins update tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'parent'
    )
  );

-- Policy: Parents (admins) can delete tickets
CREATE POLICY "Admins delete tickets"
  ON support_tickets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'parent'
    )
  );

-- ============================================================================
-- 7. CREATE DISPLAY VIEW
-- ============================================================================

DROP VIEW IF EXISTS support_tickets_display;
CREATE VIEW support_tickets_display AS
SELECT 
  id,
  ticket_number,
  name,
  email,
  category,
  message,
  status,
  priority,
  created_at,
  updated_at,
  resolved_at,
  CONCAT('#', ticket_number) as ticket_id,
  CASE 
    WHEN status = 'open' THEN '🔴 Open'
    WHEN status = 'in_progress' THEN '🟡 In Progress'
    WHEN status = 'resolved' THEN '🟢 Resolved'
    WHEN status = 'closed' THEN '⚫ Closed'
    ELSE status
  END as status_display,
  CASE
    WHEN priority = 'urgent' THEN '🚨 Urgent'
    WHEN priority = 'high' THEN '🔴 High'
    WHEN priority = 'normal' THEN '🔵 Normal'
    WHEN priority = 'low' THEN '🟢 Low'
    ELSE priority
  END as priority_display
FROM support_tickets
ORDER BY 
  CASE status 
    WHEN 'open' THEN 1
    WHEN 'in_progress' THEN 2
    WHEN 'resolved' THEN 3
    WHEN 'closed' THEN 4
  END,
  CASE priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'normal' THEN 3
    WHEN 'low' THEN 4
  END,
  created_at DESC;

-- Grant view access
GRANT SELECT ON support_tickets_display TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Support tickets enhanced successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes applied:';
  RAISE NOTICE '  • Added any missing columns (name, email, category, etc.)';
  RAISE NOTICE '  • Security tightened: anon can only INSERT';
  RAISE NOTICE '  • Ticket numbering added: starts at #1000';
  RAISE NOTICE '  • Created view: support_tickets_display';
  RAISE NOTICE '  • Added indexes for performance';
  RAISE NOTICE '  • Dropped and recreated all RLS policies';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  • Test ticket creation at /contact-support';
  RAISE NOTICE '  • View tickets at /admin-support (parent only)';
  RAISE NOTICE '  • Verify ticket numbers display correctly';
END $$;
