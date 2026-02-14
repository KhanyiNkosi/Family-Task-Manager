-- ============================================================================
-- QUERY 1: List All Public Tables
-- Run this first to see what tables exist
-- ============================================================================

SELECT 
  tablename as table_name,
  schemaname as schema
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
