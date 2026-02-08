# Family Setup Guide for Reminder Feature

## Problem
The reminder feature requires that both parent and child profiles exist in the `profiles` table with the **same `family_id`**. Currently, your profiles table is empty or users have different family_ids.

## Solution Options

### Option 1: Run SQL Script in Supabase Dashboard (Recommended)

1. **Get User IDs from app:**
   - Log in as child, open browser console (F12), run:
     ```javascript
     const { data: { user } } = await supabase.auth.getUser();
     console.log('Child ID:', user.id);
     ```
   - Do the same for parent account

2. **Go to your Supabase Dashboard:**
   - Navigate to SQL Editor
   - Run `create-profiles-manual.sql` (in this folder)
   - Follow the instructions in that file to:
     - Generate a family_id
     - Insert parent profile with that family_id
     - Insert child profile with the SAME family_id

### Option 2: Use the Signup Trigger (For New Users)

The `supabase-setup.sql` file contains a trigger that auto-creates profiles. To use it:

1. Run the entire `supabase-setup.sql` in your Supabase SQL Editor
2. Sign up new users - they'll automatically get profiles
3. NOTE: Parent must sign up first and provide family code to child

### Option 3: Auto-Creation on First Login (Current Implementation)

The app now auto-creates a profile when a child logs in (added in latest commit).

**BUT**: Each user gets their own `family_id`, so reminders won't work until you manually link them:

```sql
-- In Supabase SQL Editor, update child's family_id to match parent's
UPDATE profiles 
SET family_id = (SELECT family_id FROM profiles WHERE role = 'parent' LIMIT 1)
WHERE role = 'child';
```

## Verify Family Setup

Run this in Supabase SQL Editor to check:

```sql
SELECT 
  p.family_id,
  p.role,
  p.full_name,
  p.email
FROM profiles p
ORDER BY p.family_id, p.role;
```

You should see:
- Both parent and child with the SAME family_id
- One profile with role='parent'
- One or more profiles with role='child'

## Testing the Reminder Feature

Once family setup is complete:

1. Log in as child
2. Complete a task (it will show "Pending Approval")
3. Click the "Remind" button
4. Check browser console for debug logs:
   - Should show parent found
   - Notification created
5. Log in as parent - you should see the notification

## Debugging

If you see "No parent found":

1. **Check console logs** - added debug output shows:
   - `parentProfile` - should be an object with id and role
   - `parentError` - should be null
   - `familyId` - should match between parent and child

2. **Verify profiles table**:
   ```sql
   SELECT * FROM profiles;
   ```
   - Should have at least 2 rows (parent + child)
   - Family_id should match

3. **Check RLS policies**:
   - Make sure profiles table has appropriate SELECT policies
   - Run `fix-rls-final.sql` if needed

## Quick Fix Command

If you just want to test and have one parent and one child:

```sql
-- Generate a family_id
SELECT gen_random_uuid(); -- Copy this UUID

-- Update both users to use that family_id
UPDATE profiles SET family_id = 'PASTE-UUID-HERE' WHERE role = 'parent';
UPDATE profiles SET family_id = 'PASTE-UUID-HERE' WHERE role = 'child';

-- Verify
SELECT role, family_id FROM profiles;
```

## Changes Made

1. ✅ Auto-create profile on child login (child-dashboard)
2. ✅ Better error messages with guidance
3. ✅ Debug logging (check console)
4. ✅ Changed `.single()` to `.maybeSingle()` (handles no results gracefully)
5. ✅ Added console.log for parent lookup debugging

## Files Modified

- `app/child-dashboard/page.tsx` - Auto-create profile + better errors
- `app/my-rewards/page.tsx` - Better error handling
- `create-profiles-manual.sql` - Manual setup script
- `REMINDER-SETUP-GUIDE.md` - This guide
