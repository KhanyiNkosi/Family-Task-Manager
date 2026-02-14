# Photo Verification System Setup Guide

## Overview
This system allows children to upload photos when completing tasks, providing visual verification for parents before approval.

## 🗄️ Supabase Storage Setup

### Step 1: Create Storage Bucket

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Configure the bucket:
   ```
   Name: task-photos
   Public: ☑️ (checked - so photos can be displayed)
   File size limit: 5 MB
   Allowed MIME types: image/jpeg, image/png, image/webp, image/heic
   ```
4. Click **"Create bucket"**

### Step 2: Configure Storage Policies

Run this SQL in your **Supabase SQL Editor**:

```sql
-- ============================================================================
-- STORAGE POLICIES FOR task-photos BUCKET
-- ============================================================================

-- Policy: Authenticated users can upload photos
CREATE POLICY "Authenticated users can upload task photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view photos from their family
CREATE POLICY "Users can view family task photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-photos'
  AND EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p1.family_id = p2.family_id
    WHERE p1.id = auth.uid()
    AND p2.id::text = (storage.foldername(name))[1]
  )
);

-- Policy: Users can delete their own photos
CREATE POLICY "Users can delete own task photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Parents can delete any family photos
CREATE POLICY "Parents can delete family task photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-photos'
  AND EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p1.family_id = p2.family_id
    WHERE p1.id = auth.uid()
    AND p1.role = 'parent'
    AND p2.id::text = (storage.foldername(name))[1]
  )
);
```

## 📊 Database Schema Updates

Add photo URL column to tasks table:

```sql
-- Add photo verification columns to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS photo_uploaded_at TIMESTAMPTZ;

-- Add comment explaining photo verification process
COMMENT ON COLUMN tasks.photo_url IS 'URL to task completion photo stored in Supabase Storage';
COMMENT ON COLUMN tasks.photo_uploaded_at IS 'Timestamp when photo was uploaded';

-- Create index for quick photo lookup
CREATE INDEX IF NOT EXISTS idx_tasks_photo ON tasks(photo_url) WHERE photo_url IS NOT NULL;
```

## 📁 File Organization Structure

Photos will be organized in storage like this:
```
task-photos/
├── {user_id}/
│   ├── task_{task_id}_{timestamp}.jpg
│   ├── task_{task_id}_{timestamp}.png
│   └── ...
```

Example:
```
task-photos/
├── 550e8400-e29b-41d4-a716-446655440000/
│   ├── task_abc123_1704067200000.jpg
│   ├── task_def456_1704153600000.png
```

## 🔧 Frontend Implementation Guide

### 1. Install Dependencies
```bash
npm install @supabase/storage-js
```

### 2. Upload Function Example
```typescript
import { createClientSupabaseClient } from '@/lib/supabaseClient';

async function uploadTaskPhoto(
  taskId: string,
  photoFile: File
): Promise<string | null> {
  const supabase = createClientSupabaseClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Generate unique filename
  const timestamp = Date.now();
  const fileExt = photoFile.name.split('.').pop();
  const fileName = `task_${taskId}_${timestamp}.${fileExt}`;
  const filePath = `${user.id}/${fileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('task-photos')
    .upload(filePath, photoFile, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('task-photos')
    .getPublicUrl(filePath);

  return publicUrl;
}
```

### 3. Compress Images Before Upload
```typescript
// Install: npm install browser-image-compression

import imageCompression from 'browser-image-compression';

async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error('Compression error:', error);
    return file; // Return original if compression fails
  }
}
```

### 4. Complete Task with Photo
```typescript
async function completeTaskWithPhoto(
  taskId: string,
  photoFile: File
) {
  const supabase = createClientSupabaseClient();

  // 1. Compress image
  const compressedPhoto = await compressImage(photoFile);

  // 2. Upload to storage
  const photoUrl = await uploadTaskPhoto(taskId, compressedPhoto);
  
  if (!photoUrl) {
    throw new Error('Failed to upload photo');
  }

  // 3. Update task with photo URL and mark as completed
  const { error } = await supabase
    .from('tasks')
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
      photo_url: photoUrl,
      photo_uploaded_at: new Date().toISOString()
    })
    .eq('id', taskId);

  if (error) throw error;

  return photoUrl;
}
```

## 🎨 UI Components to Add

### 1. Photo Upload Button (Child Dashboard)
```tsx
<div className="mb-4">
  <label className="block text-sm font-medium mb-2">
    📸 Add Photo Proof (Optional)
  </label>
  <input
    type="file"
    accept="image/*"
    capture="environment" // Opens camera on mobile
    onChange={handlePhotoSelect}
    className="block w-full text-sm text-gray-500
      file:mr-4 file:py-2 file:px-4
      file:rounded-lg file:border-0
      file:text-sm file:font-semibold
      file:bg-cyan-50 file:text-cyan-700
      hover:file:bg-cyan-100"
  />
</div>
```

### 2. Photo Viewer (Parent Dashboard)
```tsx
{task.photo_url && (
  <div className="mt-4">
    <img
      src={task.photo_url}
      alt="Task completion proof"
      className="w-full h-48 object-cover rounded-lg cursor-pointer"
      onClick={() => setLightboxImage(task.photo_url)}
    />
    <p className="text-xs text-gray-500 mt-1">
      Uploaded: {new Date(task.photo_uploaded_at).toLocaleString()}
    </p>
  </div>
)}
```

### 3. Image Lightbox Modal
```tsx
{lightboxImage && (
  <div
    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
    onClick={() => setLightboxImage(null)}
  >
    <img
      src={lightboxImage}
      alt="Full size"
      className="max-w-full max-h-full object-contain"
    />
    <button
      onClick={() => setLightboxImage(null)}
      className="absolute top-4 right-4 text-white text-2xl"
    >
      ✕
    </button>
  </div>
)}
```

## ✅ Testing Checklist

- [ ] Upload bucket created with correct permissions
- [ ] Storage policies applied successfully
- [ ] Tasks table updated with photo columns
- [ ] Photo upload works from child dashboard
- [ ] Photos display correctly in parent dashboard
- [ ] Image compression reduces file size
- [ ] Mobile camera capture works
- [ ] Photos are private (only family can view)
- [ ] Delete photo function works
- [ ] Lightbox modal displays full-size images

## 🔒 Security Considerations

1. **File Size Limits**: Enforced at bucket level (5MB max)
2. **MIME Type Restrictions**: Only image formats allowed
3. **User Isolation**: Users can only upload to their own folder
4. **Family Privacy**: Only family members can view photos
5. **Parent Control**: Parents can delete any family photos

## 💰 Storage Costs (Supabase Free Tier)

- **Storage**: 1 GB included free
- **Bandwidth**: 2 GB/month included free
- **Estimate**: ~500 photos (2MB average) within free tier

For 100 active families uploading 10 photos/month each:
- Storage: ~2GB ($0.021/GB/month × 1GB overage = $0.02/month)
- Bandwidth: ~4GB ($0.09/GB × 2GB overage = $0.18/month)
- **Total**: ~$0.20/month or $2.40/year

## 📚 Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Image Compression Library](https://github.com/Donaldcwl/browser-image-compression)
- [React Dropzone](https://react-dropzone.js.org/) - Advanced file upload UI

## 🚀 Future Enhancements

- [ ] **Before/After Photos**: Upload 2 photos per task
- [ ] **Photo Gallery**: View all task photos in timeline
- [ ] **Photo Annotations**: Parents can add comments on photos
- [ ] **Auto-Delete**: Remove photos after 30 days to save storage
- [ ] **Lazy Loading**: Load photos only when visible
- [ ] **WebP Conversion**: Convert to WebP for smaller file sizes
