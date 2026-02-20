-- Check storage bucket policies
SELECT * FROM storage.buckets WHERE name = 'task-photos';

-- Check storage object policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
