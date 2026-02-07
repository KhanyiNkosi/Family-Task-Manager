-- ============================================================================
-- CREATE BULLETIN MESSAGES TABLE
-- Run in Supabase SQL Editor
-- ============================================================================

-- Create bulletin_messages table
CREATE TABLE IF NOT EXISTS bulletin_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL,
  posted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bulletin_messages_family_id ON bulletin_messages(family_id);
CREATE INDEX IF NOT EXISTS idx_bulletin_messages_created_at ON bulletin_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bulletin_messages_posted_by ON bulletin_messages(posted_by);

-- Enable Row Level Security
ALTER TABLE bulletin_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bulletin_messages
-- Users can view messages from their family
CREATE POLICY "Users can view their family bulletin messages"
  ON bulletin_messages FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can insert messages for their family
CREATE POLICY "Users can create family bulletin messages"
  ON bulletin_messages FOR INSERT
  WITH CHECK (
    posted_by = auth.uid() AND
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can update their own messages
CREATE POLICY "Users can update their own bulletin messages"
  ON bulletin_messages FOR UPDATE
  USING (posted_by = auth.uid());

-- Users can delete their own messages
CREATE POLICY "Users can delete their own bulletin messages"
  ON bulletin_messages FOR DELETE
  USING (posted_by = auth.uid());

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_bulletin_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_bulletin_messages_updated_at ON bulletin_messages;
CREATE TRIGGER update_bulletin_messages_updated_at
  BEFORE UPDATE ON bulletin_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_bulletin_messages_updated_at();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ BULLETIN MESSAGES TABLE CREATED!';
  RAISE NOTICE '';
  RAISE NOTICE 'Table features:';
  RAISE NOTICE '  • Stores family bulletin board messages';
  RAISE NOTICE '  • RLS enabled for family-based access';
  RAISE NOTICE '  • Indexed for performance';
  RAISE NOTICE '  • Auto-updating timestamps';
  RAISE NOTICE '';
END $$;
