-- ============================================================================
-- QUERY 7: Check Storage Buckets
-- Verify if 'task-photos' bucket exists yet
-- ============================================================================

SELECT 
  name as bucket_name,
  public as is_public,
  created_at
FROM storage.buckets
ORDER BY name;

-- We need to check if 'task-photos' bucket exists
-- If it doesn't exist, we'll need to create it manually in Supabase Dashboard
-- (Storage buckets can't be created via SQL, must use Dashboard or API)
