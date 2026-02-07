# Notification System Fix - Complete Setup Guide

## Issue Fixed
The notification system was inactive due to **incorrect cookie handling** in the API routes. The `cookies()` function from Next.js is **synchronous** and was being incorrectly awaited, causing authentication errors.

### Error Fixed:
```
Auth session missing! 
GET /api/notifications?limit=50 401
```

## Files Fixed
✅ `/app/api/notifications/route.ts`
✅ `/app/api/notifications/[id]/route.ts`  
✅ `/app/api/notifications/mark-all-read/route.ts`

Changed from:
```typescript
const cookieStore = await cookies(); // ❌ WRONG
```

To:
```typescript
const cookieStore = cookies(); // ✅ CORRECT
```

---

## Complete Setup Checklist

### 1. ✅ Database Setup (Run in Supabase SQL Editor)

#### Step 1: Create Notifications Table
Run this file in your Supabase SQL Editor:
```
create-notifications-table.sql
```

This creates:
- `notifications` table
- Row Level Security (RLS) policies
- Helper functions (`create_notification`, `mark_notification_read`, etc.)
- Realtime subscriptions

#### Step 2: Create Notification Triggers
Run this file in your Supabase SQL Editor:
```
create-notification-triggers.sql
```

This creates triggers for:
- ✅ Task completion → notifies parent
- ✅ Task approval → notifies child
- ✅ Task assignment → notifies child
- ✅ Help requests → notifies parent
- ✅ Reward requests → notifies parent
- ✅ Reward approval/denial → notifies child

### 2. ✅ Verify Database Setup

Run this file to verify everything is set up correctly:
```
verify-notification-system.sql
```

Expected outputs:
- ✅ `notifications` table exists
- ✅ At least 4 RLS policies exist
- ✅ 6 triggers on `tasks` and `reward_redemptions` tables
- ✅ Multiple notification functions exist

### 3. ✅ Application Code (Already Integrated)

The following components are already set up:
- ✅ `hooks/useNotifications.ts` - Custom hook with realtime subscriptions
- ✅ `components/NotificationAlert.tsx` - UI component for displaying notifications
- ✅ `app/api/notifications/*` - Backend API routes (NOW FIXED)
- ✅ `app/parent-dashboard/page.tsx` - Uses notification system
- ✅ `app/child-dashboard/page.tsx` - Uses notification system

---

## How to Test

### Test 1: Create a Task (Parent)
1. Login as parent
2. Create a new task and assign it to a child
3. **Expected**: Child receives notification immediately

### Test 2: Complete a Task (Child)
1. Login as child
2. Mark a task as completed
3. **Expected**: Parent receives notification immediately

### Test 3: Approve a Task (Parent)
1. Login as parent
2. View completed task and click "Approve"
3. **Expected**: Child receives approval notification

### Test 4: Request a Reward (Child)
1. Login as child
2. Request a reward from the rewards store
3. **Expected**: Parent receives reward request notification

### Test 5: Approve/Deny Reward (Parent)
1. Login as parent
2. Approve or deny the reward request
3. **Expected**: Child receives approval/denial notification

---

## Troubleshooting

### Issue: No notifications appearing
**Check:**
1. Have you run both SQL files in Supabase?
   ```sql
   -- Run in Supabase SQL Editor
   SELECT COUNT(*) FROM notifications;
   ```

2. Are the triggers created?
   ```sql
   -- Run in Supabase SQL Editor  
   SELECT trigger_name, event_object_table 
   FROM information_schema.triggers 
   WHERE trigger_schema = 'public';
   ```

3. Check browser console for errors
   - Open DevTools (F12)
   - Look for 401 errors or other API errors
   - Should see "Notification change:" logs when notifications arrive

### Issue: 401 Unauthorized errors
**Fixed!** The cookie handling issue has been resolved. Restart your dev server:
```bash
npm run dev
```

### Issue: Notifications created but not appearing in UI
**Check:**
1. Is the user logged in?
2. Open browser console - are there WebSocket connection errors?
3. Check if realtime is enabled in Supabase:
   - Go to Supabase Dashboard → Database → Replication
   - Ensure `notifications` table is enabled for replication

### Issue: Triggers not firing
**Check:**
1. Are the trigger functions created?
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name LIKE '%notify%';
   ```

2. Test manually:
   ```sql
   -- Replace with real IDs from your database
   SELECT create_notification(
     'user-id-here'::uuid,
     'family-code-here',
     'Test Notification',
     'This is a test',
     'info'
   );
   ```

---

## Advanced: Manual Notification Creation

You can manually create notifications from anywhere in your code:

```typescript
import { createClientSupabaseClient } from '@/lib/supabaseClient';

const supabase = createClientSupabaseClient();

// Create notification using RPC
const { data, error } = await supabase.rpc('create_notification', {
  p_user_id: userId,
  p_family_id: familyId,
  p_title: 'Custom Notification',
  p_message: 'Your custom message here',
  p_type: 'info', // info, success, warning, error, task, reward
  p_action_url: '/some-page',
  p_action_text: 'View Details'
});
```

Or use the API:

```typescript
const response = await fetch('/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'uuid-here',
    familyId: 'family-code',
    title: 'Custom Notification',
    message: 'Your message',
    type: 'info',
    actionUrl: '/some-page',
    actionText: 'View Details'
  })
});
```

---

## Summary

✅ **Database Setup**: Create table and triggers in Supabase
✅ **API Fix**: Removed incorrect `await` from `cookies()` calls
✅ **Verification**: Use verification SQL to check setup
✅ **Testing**: Test all notification scenarios

Your notification system should now be **fully operational**! 🎉
