-- Fix Storage RLS policies for task-photos bucket
-- Allow children and parents to upload photos

-- First, ensure the bucket exists and has RLS enabled
UPDATE storage.buckets
SET public = false,
    file_size_limit = 5242880, -- 5MB limit
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
WHERE name = 'task-photos';

-- Drop existing policies if any
DROP POLICY IF EXISTS "task_photos_insert" ON storage.objects;
DROP POLICY IF EXISTS "task_photos_select" ON storage.objects;
DROP POLICY IF EXISTS "task_photos_update" ON storage.objects;
DROP POLICY IF EXISTS "task_photos_delete" ON storage.objects;

-- Allow authenticated users to upload photos to their own folder
CREATE POLICY "task_photos_insert" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read all photos in task-photos bucket
CREATE POLICY "task_photos_select" ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'task-photos');

-- Allow users to update their own photos
CREATE POLICY "task_photos_update" ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'task-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'task-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own photos
CREATE POLICY "task_photos_delete" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Verify policies were created
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE 'task_photos%'
ORDER BY policyname;
