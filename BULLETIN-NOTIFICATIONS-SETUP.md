# Bulletin Board Notifications Setup Guide

## Problem
Bulletin board messages are currently only stored in local state and don't trigger notifications to family members.

## Solution
Add database persistence and notification triggers for bulletin messages.

---

## Step 1: Create Bulletin Messages Table

Run this in **Supabase SQL Editor**:

```bash
# File: create-bulletin-messages-table.sql
```

This creates:
- `bulletin_messages` table with RLS policies
- Indexes for performance
- Auto-updating timestamps

---

## Step 2: Add Notification Triggers

Run this in **Supabase SQL Editor**:

```bash
# File: fix-notification-triggers.sql
```

This updates all notification triggers including the new bulletin message trigger that notifies all family members (except the poster) when a new message is posted.

---

## Step 3: Test the Setup

### Option A: Quick Test via Supabase SQL Editor

```sql
-- Insert a test bulletin message
INSERT INTO bulletin_messages (family_id, posted_by, message)
VALUES (
  'YOUR_FAMILY_ID_HERE',  -- Replace with real family_id
  'YOUR_USER_ID_HERE',     -- Replace with real user_id
  'Test bulletin message - checking notifications!'
);

-- Check if notifications were created
SELECT * FROM notifications 
WHERE title = 'New Family Message' 
ORDER BY created_at DESC 
LIMIT 5;
```

### Option B: Test via the App

1. Run the updated parent dashboard code
2. Post a bulletin message from parent dashboard
3. Check child dashboard - they should receive a notification
4. Check parent's own notifications - they should NOT receive their own message

---

## Step 4: Update Parent Dashboard (Required)

The parent dashboard code needs to be updated to save bulletin messages to the database instead of just local state. This is essential for notifications to work!

Key changes needed in `/app/parent-dashboard/page.tsx`:

1. Load bulletin messages from database on mount
2. Save new messages to database (instead of just setState)
3. Delete messages from database (instead of just setState)
4. Subscribe to real-time bulletin message updates

---

## Expected Behavior

✅ **When a parent posts a bulletin message:**
- Message is saved to `bulletin_messages` table
- All children in the family receive a notification
- Other parents in the family receive a notification
- The poster does NOT receive their own notification

✅ **Notification displays:**
- Title: "New Family Message"
- Message: "[Poster Name] posted: [First 100 chars of message]"
- Type: info (blue notification)
- Action: Links to parent-dashboard

---

## Troubleshooting

### No notifications appearing?

1. **Check if table was created:**
   ```sql
   SELECT * FROM bulletin_messages LIMIT 1;
   ```

2. **Check if trigger was created:**
   ```sql
   SELECT tgname FROM pg_trigger 
   WHERE tgname = 'bulletin_message_notification';
   ```

3. **Check if notifications table has entries:**
   ```sql
   SELECT * FROM notifications 
   WHERE type = 'info' 
   ORDER BY created_at DESC;
   ```

4. **Verify family_id matches:**
   ```sql
   SELECT p.id, p.full_name, p.family_id 
   FROM profiles p 
   WHERE p.family_id IN (
     SELECT family_id FROM bulletin_messages
   );
   ```

### Messages not persisting?

- Parent dashboard still uses local state instead of database
- Update the `handleAddBulletinMessage` function to call Supabase
- See Step 4 above

---

## Next Steps

Once the SQL is run in Supabase:
1. Update parent dashboard to use the database (code changes needed)
2. Test bulletin message posting
3. Verify notifications appear for all family members
4. Check that real-time updates work properly

---

## Files Modified

- ✅ `create-bulletin-messages-table.sql` - New table creation
- ✅ `fix-notification-triggers.sql` - Added bulletin message trigger
- ⏳ `app/parent-dashboard/page.tsx` - Needs update to use database

---

Would you like me to update the parent dashboard code to integrate with the database?
