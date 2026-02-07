# Notification System Setup Guide

## Overview

The Family Task Manager now has a complete notification system with:
- ✅ Database-backed storage for notifications
- ✅ Real-time updates via Supabase subscriptions
- ✅ Beautiful UI with notification bell and expandable list
- ✅ Automatic notifications for task and reward events
- ✅ API endpoints for managing notifications
- ✅ Easy-to-use React hook for components

## Setup Instructions

### 1. Database Setup

Run the following SQL files in your Supabase SQL Editor **in order**:

#### Step 1: Create Notifications Table
Run: `create-notifications-table.sql`

This creates:
- `notifications` table with all necessary columns
- Row Level Security (RLS) policies
- Helper functions for creating and managing notifications
- Indexes for performance
- Real-time subscriptions enabled

#### Step 2: Create Notification Triggers
Run: `create-notification-triggers.sql`

This creates automatic notifications for:
- Task completion (notifies parent)
- Task approval (notifies child)
- Task assignment (notifies child)
- Help requests (notifies parent)
- Reward requests (notifies parent)
- Reward approval/denial (notifies child)

### 2. Verify Setup

After running the SQL scripts, verify:

```sql
-- Check if notifications table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'notifications';

-- Check if triggers are active
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table IN ('tasks', 'reward_redemptions');

-- Check if realtime is enabled
SELECT schemaname, tablename FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

### 3. Test the System

#### Manual Test
```sql
-- Create a test notification
SELECT create_notification(
  auth.uid(), -- user_id
  'your-family-code', -- family_id
  'Test Notification',
  'This is a test message',
  'info',
  '/dashboard',
  'View Dashboard'
);

-- View your notifications
SELECT * FROM notifications WHERE user_id = auth.uid();
```

## Using Notifications in Your Code

### Using the Hook (Recommended)

```tsx
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const { 
    notifications,      // Array of notifications
    unreadCount,        // Number of unread notifications
    loading,            // Loading state
    error,              // Error state
    fetchNotifications, // Manually refresh
    markAsRead,         // Mark one as read
    markAllAsRead,      // Mark all as read
    dismissNotification,// Delete one notification
    createNotification, // Create new notification
  } = useNotifications();

  return (
    <div>
      <NotificationAlert
        notifications={notifications}
        onDismiss={dismissNotification}
        onMarkAsRead={markAsRead}
      />
    </div>
  );
}
```

### Using the Service Functions

```tsx
import { notificationService } from '@/lib/notifications';

// When a task is completed
await notificationService.notifyTaskCompleted({
  parentId: 'parent-uuid',
  childName: 'Sarah',
  taskName: 'Clean Room',
  points: 50,
  familyId: 'family-123',
  taskId: 'task-uuid'
});

// When a task is assigned
await notificationService.notifyTaskAssigned({
  childId: 'child-uuid',
  taskName: 'Do Homework',
  points: 30,
  familyId: 'family-123',
  taskId: 'task-uuid'
});

// When a reward is requested
await notificationService.notifyRewardRequested({
  parentId: 'parent-uuid',
  childName: 'John',
  rewardName: 'Extra Screen Time',
  points: 100,
  familyId: 'family-123'
});

// Send custom notification to multiple users
await notificationService.notifyFamilyMessage({
  userIds: ['uuid1', 'uuid2', 'uuid3'],
  familyId: 'family-123',
  title: 'Family Announcement',
  message: 'Pizza night tonight! 🍕'
});
```

### Direct API Calls

#### Get Notifications
```typescript
const response = await fetch('/api/notifications?limit=50&unread=true');
const { notifications } = await response.json();
```

#### Create Notification
```typescript
const response = await fetch('/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-uuid',
    familyId: 'family-code',
    title: 'Hello!',
    message: 'This is a notification',
    type: 'info',
    actionUrl: '/dashboard',
    actionText: 'View'
  })
});
```

#### Mark as Read
```typescript
await fetch(`/api/notifications/${notificationId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ read: true })
});
```

#### Delete Notification
```typescript
await fetch(`/api/notifications/${notificationId}`, {
  method: 'DELETE'
});
```

#### Mark All as Read
```typescript
await fetch('/api/notifications/mark-all-read', {
  method: 'POST'
});
```

## Notification Types

The system supports 6 notification types with different colors and icons:

- `info` - Blue, info icon (general messages)
- `success` - Green, checkmark icon (completed actions)
- `warning` - Yellow, warning icon (alerts/reminders)
- `error` - Red, error icon (urgent issues)
- `task` - Blue, bell icon (task-related)
- `reward` - Purple, checkmark icon (reward-related)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notifications` | GET | Get all notifications for current user |
| `/api/notifications` | POST | Create a new notification |
| `/api/notifications` | DELETE | Delete all read notifications |
| `/api/notifications/[id]` | PATCH | Mark a notification as read/unread |
| `/api/notifications/[id]` | DELETE | Delete a specific notification |
| `/api/notifications/mark-all-read` | POST | Mark all notifications as read |

## Real-time Features

The notification system uses Supabase real-time subscriptions to automatically:
- Show new notifications instantly without page refresh
- Update notification status when marked as read
- Remove notifications when dismissed
- Keep all browser tabs in sync

## Database Schema

```sql
Table: notifications
├── id (UUID, Primary Key)
├── user_id (UUID, Foreign Key to auth.users)
├── family_id (TEXT)
├── title (TEXT)
├── message (TEXT)
├── type (TEXT: info|success|warning|error|task|reward)
├── action_url (TEXT, optional)
├── action_text (TEXT, optional)
├── read (BOOLEAN, default: false)
├── created_at (TIMESTAMP WITH TIME ZONE)
└── updated_at (TIMESTAMP WITH TIME ZONE)
```

## Automatic Triggers

The system automatically creates notifications for:

1. **Task Completion** - Parent notified when child completes task
2. **Task Approval** - Child notified when parent approves task
3. **Task Assignment** - Child notified when new task assigned
4. **Help Request** - Parent notified when child requests help
5. **Reward Request** - Parent notified when child requests reward
6. **Reward Approval** - Child notified when reward approved
7. **Reward Denial** - Child notified when reward denied

## Troubleshooting

### Notifications not showing up?

1. Check if realtime is enabled:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

2. Verify RLS policies allow reading:
```sql
SELECT * FROM notifications WHERE user_id = auth.uid();
```

3. Check browser console for errors

### Triggers not firing?

1. Verify triggers exist:
```sql
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'tasks';
```

2. Check trigger functions:
```sql
SELECT proname FROM pg_proc WHERE proname LIKE '%notify%';
```

### API returning 401 Unauthorized?

Make sure user is authenticated:
```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

## Cleanup

To remove old notifications (older than 30 days):

```sql
SELECT cleanup_old_notifications();
```

You can set up a cron job to run this periodically.

## Next Steps

Consider adding:
- [ ] Email notifications for critical alerts
- [ ] Push notifications for mobile devices
- [ ] Notification preferences in user settings
- [ ] Notification categories/filters
- [ ] Sound effects for new notifications
- [ ] Desktop notifications API integration

## Support

For issues or questions:
1. Check browser console for errors
2. Check Supabase logs
3. Verify database triggers are active
4. Test with manual SQL queries first
