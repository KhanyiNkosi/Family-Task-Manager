# Family Code Not Displaying - Troubleshooting Guide

## Issue
User can't see family code in Settings page after running SQL fixes.

## Frontend Checks

### 1. Hard Refresh Browser
The page might be cached. Have the user:
- **Chrome/Edge**: Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- **Firefox**: Press `Ctrl + F5`
- Or clear browser cache and reload

### 2. Check Browser Console
Have user open browser console (F12) and check for:
- Red errors when loading Settings page
- The console.log messages: "No user found" or "No family_id found in profile"
- Any RLS policy errors from Supabase

### 3. Check Network Tab
In browser DevTools (F12) → Network tab:
- Filter for "profiles" or "supabase"
- Look at the response for the profiles query
- Check if `family_id` field is present in the JSON response

## Database Checks

### Run debug-family-code-access.sql
This shows:
- All parent users and their family_id status
- Whether family exists in families table
- RLS policies that might block access

### Expected Results
For each parent user, you should see:
```
status: ✅ GOOD: Has family_id and family exists
profile_family_id: <some-uuid>
families_table_id: <same-uuid-as-text>
```

### If Status Shows Issues

**❌ profiles.family_id is NULL**
→ Backfill didn't work or user wasn't included
→ Manually update: 
```sql
-- First create family
INSERT INTO families (id, owner_id, created_at) 
VALUES (gen_random_uuid()::text, '<user-id>', NOW());

-- Then update profile (use same UUID)
UPDATE profiles 
SET family_id = '<that-uuid>'
WHERE id = '<user-id>';
```

**⚠️ family_id exists but NO matching family in families table**
→ Type mismatch or missing family record
→ Create missing family:
```sql
INSERT INTO families (id, owner_id, created_at)
SELECT 
  family_id::text,
  id,
  NOW()
FROM profiles
WHERE id = '<user-id>'
ON CONFLICT (id) DO NOTHING;
```

## RLS Policy Check

If RLS is blocking access, run:
```sql
-- Check current policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'SELECT';

-- Ensure user can read their own profile
CREATE POLICY IF NOT EXISTS "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
```

## Test Query
User can test directly in Supabase SQL Editor with their actual user ID:
```sql
-- Replace <user-id> with actual UUID from auth.users
SELECT id, email, role, family_id 
FROM profiles 
WHERE id = '<user-id>';
```

## Quick Fix for Single User
If a specific user still can't see it:
```sql
-- Get their current state
SELECT id, email, family_id FROM profiles WHERE email = 'user@email.com';

-- If family_id is NULL, create and assign family
DO $$
DECLARE
  v_user_id UUID := '<user-id-from-above>';
  v_new_family_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO families (id, owner_id, created_at)
  VALUES (v_new_family_id::text, v_user_id, NOW());
  
  UPDATE profiles 
  SET family_id = v_new_family_id 
  WHERE id = v_user_id;
  
  RAISE NOTICE 'Created family % for user %', v_new_family_id, v_user_id;
END $$;
```

## Most Common Causes
1. **Browser cache** (90% of cases) - Hard refresh fixes it
2. **Console errors** - Check for Supabase API errors
3. **Missing family in families table** - family_id exists but no matching row
4. **RLS blocking** - User can't query their own profile

## Next Steps
1. Run debug-family-code-access.sql
2. Check browser console (F12)
3. Hard refresh (Ctrl+Shift+R)
4. Share results if still not working
