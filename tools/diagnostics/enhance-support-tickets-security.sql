-- Enhance support_tickets table with better security and ticket numbering
-- Run this in Supabase SQL Editor

-- 1. Add ticket_number column for human-readable IDs
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS ticket_number INTEGER;

-- 2. Create sequence for ticket numbers
CREATE SEQUENCE IF NOT EXISTS support_ticket_number_seq START WITH 1000;

-- 3. Function to auto-assign ticket numbers
CREATE OR REPLACE FUNCTION assign_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number = nextval('support_ticket_number_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger for auto-numbering
DROP TRIGGER IF EXISTS assign_ticket_number_trigger ON support_tickets;
CREATE TRIGGER assign_ticket_number_trigger
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION assign_ticket_number();

-- 5. Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_number ON support_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assignee_id ON support_tickets(assignee_id);

-- 6. REVOKE wide permissions from anon
REVOKE ALL ON support_tickets FROM anon;

-- 7. Grant minimal permissions to anon (only INSERT for contact form)
GRANT INSERT ON support_tickets TO anon;

-- 8. DROP existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can create support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Parents can view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Parents can update tickets" ON support_tickets;

-- 9. CREATE tighter RLS policies

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

-- 10. Add helpful view for ticket display
CREATE OR REPLACE VIEW support_tickets_display AS
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

-- 11. Grant view access
GRANT SELECT ON support_tickets_display TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Support tickets enhanced successfully!';
  RAISE NOTICE 'Security tightened: anon can only INSERT, authenticated users can view own tickets, parents have full access';
  RAISE NOTICE 'Ticket numbering added: starts at #1000';
  RAISE NOTICE 'View created: support_tickets_display for easy querying';
END $$;
