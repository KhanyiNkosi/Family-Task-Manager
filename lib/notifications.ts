import { Notification, NotificationType } from "@/components/NotificationAlert";

// Notification types specific to FamilyTask
export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task' as NotificationType,
  TASK_COMPLETED: 'success' as NotificationType,
  REWARD_EARNED: 'reward' as NotificationType,
  REWARD_CLAIMED: 'success' as NotificationType,
  TASK_OVERDUE: 'warning' as NotificationType,
  ACHIEVEMENT_UNLOCKED: 'success' as NotificationType,
  SYSTEM_MESSAGE: 'info' as NotificationType,
  URGENT: 'error' as NotificationType,
};

// Helper to create notifications
export function createNotification(
  title: string,
  message: string,
  type: NotificationType = 'info',
  options?: {
    actionUrl?: string;
    actionText?: string;
    autoRead?: boolean;
  }
): Notification {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    title,
    message,
    type,
    timestamp: new Date(),
    read: options?.autoRead || false,
    actionUrl: options?.actionUrl,
    actionText: options?.actionText,
  };
}

// Pre-made notification templates
export const notificationTemplates = {
  taskAssigned: (childName: string, taskName: string, taskId?: string) =>
    createNotification(
      'Task Assigned',
      `${childName} has been assigned "${taskName}"`,
      NOTIFICATION_TYPES.TASK_ASSIGNED,
      {
        actionUrl: taskId ? `/parent-dashboard/tasks/${taskId}` : '/parent-dashboard/tasks',
        actionText: 'View Task',
      }
    ),

  taskCompleted: (childName: string, taskName: string, points: number) =>
    createNotification(
      'Task Completed!',
      `${childName} completed "${taskName}" and earned ${points} points`,
      NOTIFICATION_TYPES.TASK_COMPLETED,
      {
        actionUrl: '/parent-dashboard/activities',
        actionText: 'View Activity',
      }
    ),

  rewardEarned: (childName: string, rewardName: string, points: number) =>
    createNotification(
      'Reward Earned!',
      `${childName} earned "${rewardName}" for ${points} points`,
      NOTIFICATION_TYPES.REWARD_EARNED,
      {
        actionUrl: '/child-dashboard/rewards',
        actionText: 'Claim Reward',
      }
    ),

  taskOverdue: (taskName: string, childName?: string) =>
    createNotification(
      'Task Overdue',
      childName 
        ? `"${taskName}" assigned to ${childName} is overdue`
        : `"${taskName}" is overdue`,
      NOTIFICATION_TYPES.TASK_OVERDUE,
      {
        actionUrl: '/tasks',
        actionText: 'View Tasks',
      }
    ),

  achievementUnlocked: (childName: string, achievement: string) =>
    createNotification(
      'Achievement Unlocked!',
      `${childName} unlocked "${achievement}" achievement`,
      NOTIFICATION_TYPES.ACHIEVEMENT_UNLOCKED,
      {
        actionUrl: '/achievements',
        actionText: 'View Achievement',
      }
    ),
};

// Storage key for persistent notifications
export const NOTIFICATION_STORAGE_KEY = 'familytask_notifications';

// Save notifications to localStorage
export function saveNotificationsToStorage(notifications: Notification[]): void {
  try {
    const serialized = notifications.map(notif => ({
      ...notif,
      timestamp: notif.timestamp.toISOString(),
    }));
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(serialized));
  } catch (error) {
    console.error('Failed to save notifications to storage:', error);
  }
}

// Load notifications from localStorage
export function loadNotificationsFromStorage(): Notification[] {
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return parsed.map((notif: any) => ({
      ...notif,
      timestamp: new Date(notif.timestamp),
    }));
  } catch (error) {
    console.error('Failed to load notifications from storage:', error);
    return [];
  }
}

// Mark all notifications as read
export function markAllAsRead(notifications: Notification[]): Notification[] {
  return notifications.map(notif => ({ ...notif, read: true }));
}

// Filter notifications by type
export function filterByType(notifications: Notification[], type: NotificationType): Notification[] {
  return notifications.filter(notif => notif.type === type);
}

// Get unread count
export function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter(notif => !notif.read).length;
}
