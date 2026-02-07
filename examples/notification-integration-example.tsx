// Example: How to integrate notifications into your component
// ---------------------------------------------------------

import { useNotifications } from '@/hooks/useNotifications';
import NotificationAlert from '@/components/NotificationAlert';
import { notificationService } from '@/lib/notifications';

export default function ExampleComponent() {
  // 1. Get notification hook functions
  const { 
    notifications,      // All notifications for current user
    unreadCount,        // Number of unread notifications
    markAsRead,         // Mark single notification as read
    dismissNotification,// Delete a notification
    createNotification  // Create new notification
  } = useNotifications();

  // 2. Example: Send notification when action occurs
  const handleTaskComplete = async (taskId: string) => {
    // Your task completion logic here...
    
    // Send notification to parent
    await notificationService.notifyTaskCompleted({
      parentId: 'parent-user-id',
      childName: 'John',
      taskName: 'Clean Room',
      points: 50,
      familyId: 'family-123',
      taskId: taskId
    });
  };

  // 3. Example: Create custom notification
  const sendCustomNotification = async () => {
    await createNotification({
      userId: 'recipient-user-id',
      familyId: 'family-123',
      title: 'Custom Notification',
      message: 'This is a custom message',
      type: 'info',
      actionUrl: '/some-page',
      actionText: 'View Details'
    });
  };

  // 4. Render the notification UI
  return (
    <div>
      {/* Add notification alert component */}
      <NotificationAlert
        notifications={notifications}
        onDismiss={dismissNotification}
        onMarkAsRead={markAsRead}
        maxNotifications={3}
        autoClose={8000}
      />

      {/* Show unread count in your UI */}
      <div className="notification-badge">
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
      </div>

      {/* Your other component content */}
      <button onClick={handleTaskComplete}>Complete Task</button>
      <button onClick={sendCustomNotification}>Send Custom Alert</button>
    </div>
  );
}

// ---------------------------------------------------------
// NOTIFICATION SERVICE QUICK REFERENCE
// ---------------------------------------------------------

// 1. Task Completed (notify parent)
notificationService.notifyTaskCompleted({
  parentId: 'uuid',
  childName: 'Sarah',
  taskName: 'Do Homework',
  points: 30,
  familyId: 'family-123',
  taskId: 'optional-task-id'
});

// 2. Task Assigned (notify child)
notificationService.notifyTaskAssigned({
  childId: 'uuid',
  taskName: 'Clean Room',
  points: 50,
  familyId: 'family-123',
  taskId: 'optional-task-id'
});

// 3. Task Approved (notify child)
notificationService.notifyTaskApproved({
  childId: 'uuid',
  taskName: 'Do Homework',
  points: 30,
  familyId: 'family-123'
});

// 4. Reward Requested (notify parent)
notificationService.notifyRewardRequested({
  parentId: 'uuid',
  childName: 'John',
  rewardName: 'Extra Screen Time',
  points: 100,
  familyId: 'family-123'
});

// 5. Reward Approved (notify child)
notificationService.notifyRewardApproved({
  childId: 'uuid',
  rewardName: 'Extra Screen Time',
  points: 100,
  familyId: 'family-123'
});

// 6. Reward Denied (notify child)
notificationService.notifyRewardDenied({
  childId: 'uuid',
  rewardName: 'Extra Screen Time',
  points: 100,
  familyId: 'family-123'
});

// 7. Help Requested (notify parent)
notificationService.notifyHelpRequested({
  parentId: 'uuid',
  childName: 'Emma',
  taskName: 'Math Homework',
  helpMessage: 'I don\'t understand problem #5',
  familyId: 'family-123',
  taskId: 'optional-task-id'
});

// 8. Task Overdue (notify child)
notificationService.notifyTaskOverdue({
  childId: 'uuid',
  taskName: 'Clean Room',
  familyId: 'family-123',
  taskId: 'optional-task-id'
});

// 9. Family Broadcast (notify multiple users)
notificationService.notifyFamilyMessage({
  userIds: ['uuid1', 'uuid2', 'uuid3'],
  familyId: 'family-123',
  title: 'Family Dinner',
  message: 'Pizza night at 6 PM! 🍕'
});

// ---------------------------------------------------------
// DIRECT API EXAMPLES (if not using service)
// ---------------------------------------------------------

// Get notifications
const response = await fetch('/api/notifications?limit=50');
const { notifications } = await response.json();

// Get only unread notifications
const response = await fetch('/api/notifications?unread=true');
const { notifications } = await response.json();

// Create notification
await fetch('/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-uuid',
    familyId: 'family-code',
    title: 'New Message',
    message: 'You have a new notification',
    type: 'info', // info|success|warning|error|task|reward
    actionUrl: '/dashboard', // optional
    actionText: 'View Details' // optional
  })
});

// Mark as read
await fetch(`/api/notifications/${notificationId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ read: true })
});

// Delete notification
await fetch(`/api/notifications/${notificationId}`, {
  method: 'DELETE'
});

// Mark all as read
await fetch('/api/notifications/mark-all-read', {
  method: 'POST'
});

// Delete all read notifications
await fetch('/api/notifications', {
  method: 'DELETE'
});

// Delete specific notification
await fetch(`/api/notifications?id=${notificationId}`, {
  method: 'DELETE'
});
