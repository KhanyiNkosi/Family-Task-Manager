-- reset_data.sql
BEGIN;

-- Temporarily disable triggers for clean truncate
SET session_replication_role = 'replica';

-- List ALL your application tables in dependency order
-- Child tables (with foreign keys) LAST, parent tables FIRST
TRUNCATE TABLE 
  user_profiles,
  parent_profiles, 
  child_profiles,
  tasks,
  rewards,
  notifications
-- Add other tables like avatars, messages, etc. here
RESTART IDENTITY 
CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

COMMIT;
