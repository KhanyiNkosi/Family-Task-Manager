-- Add approved column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE;

-- Update existing completed tasks to be unapproved
UPDATE tasks SET approved = FALSE WHERE completed = TRUE AND approved IS NULL;
