-- Create support_tickets table for in-app support system
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  assigned_to UUID REFERENCES auth.users(id),
  user_id UUID REFERENCES auth.users(id), -- If ticket was created by logged-in user
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  admin_notes TEXT
);

-- Enable Row Level Security
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create a support ticket (even non-authenticated users)
CREATE POLICY "Anyone can create support tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (true);

-- Policy: Users can view their own tickets (by email or user_id)
CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  USING (
    auth.email() = email 
    OR auth.uid() = user_id
    OR auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'parent'
    )
  );

-- Policy: Parents can view all tickets (admin access)
CREATE POLICY "Parents can view all tickets"
  ON support_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'parent'
    )
  );

-- Policy: Parents can update tickets (admin access)
CREATE POLICY "Parents can update tickets"
  ON support_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'parent'
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_support_tickets_email ON support_tickets(email);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_support_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'resolved' OR NEW.status = 'closed' THEN
    NEW.resolved_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update timestamp
CREATE TRIGGER support_ticket_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_ticket_timestamp();

-- Grant permissions
GRANT SELECT, INSERT ON support_tickets TO anon;
GRANT ALL ON support_tickets TO authenticated;

COMMENT ON TABLE support_tickets IS 'Stores support requests from users';
COMMENT ON COLUMN support_tickets.status IS 'open, in_progress, resolved, closed';
COMMENT ON COLUMN support_tickets.priority IS 'low, normal, high, urgent';
