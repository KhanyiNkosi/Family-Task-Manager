-- Add help request columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS help_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS help_requested_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS help_message TEXT;
