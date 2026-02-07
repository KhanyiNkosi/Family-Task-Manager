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

// Service functions for creating notifications via API
export const notificationService = {
  // Create a notification for a user
  async createNotification(params: {
    userId: string;
    familyId: string;
    title: string;
    message: string;
    type?: NotificationType;
    actionUrl?: string;
    actionText?: string;
  }): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to create notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  },

  // Notify parent when task is completed
  async notifyTaskCompleted(params: {
    parentId: string;
    childName: string;
    taskName: string;
    points: number;
    familyId: string;
    taskId?: string;
  }): Promise<boolean> {
    return this.createNotification({
      userId: params.parentId,
      familyId: params.familyId,
      title: 'Task Completed!',
      message: `${params.childName} completed "${params.taskName}" and earned ${params.points} points`,
      type: 'success',
      actionUrl: params.taskId ? `/parent-dashboard?highlight=${params.taskId}` : '/parent-dashboard',
      actionText: 'View Details',
    });
  },

  // Notify child when task is assigned
  async notifyTaskAssigned(params: {
    childId: string;
    taskName: string;
    points: number;
    familyId: string;
    taskId?: string;
  }): Promise<boolean> {
    return this.createNotification({
      userId: params.childId,
      familyId: params.familyId,
      title: 'New Task Assigned',
      message: `You have been assigned "${params.taskName}" worth ${params.points} points`,
      type: 'task',
      actionUrl: params.taskId ? `/child-dashboard?highlight=${params.taskId}` : '/child-dashboard',
      actionText: 'View Task',
    });
  },

  // Notify child when task is approved
  async notifyTaskApproved(params: {
    childId: string;
    taskName: string;
    points: number;
    familyId: string;
  }): Promise<boolean> {
    return this.createNotification({
      userId: params.childId,
      familyId: params.familyId,
      title: 'Task Approved!',
      message: `Your task "${params.taskName}" has been approved! ${params.points} points added to your account`,
      type: 'success',
      actionUrl: '/child-dashboard',
      actionText: 'View Dashboard',
    });
  },

  // Notify parent of reward request
  async notifyRewardRequested(params: {
    parentId: string;
    childName: string;
    rewardName: string;
    points: number;
    familyId: string;
  }): Promise<boolean> {
    return this.createNotification({
      userId: params.parentId,
      familyId: params.familyId,
      title: 'Reward Request',
      message: `${params.childName} requested "${params.rewardName}" (${params.points} points)`,
      type: 'reward',
      actionUrl: '/parent-dashboard',
      actionText: 'Review Request',
    });
  },

  // Notify child when reward is approved
  async notifyRewardApproved(params: {
    childId: string;
    rewardName: string;
    points: number;
    familyId: string;
  }): Promise<boolean> {
    return this.createNotification({
      userId: params.childId,
      familyId: params.familyId,
      title: 'Reward Approved!',
      message: `Your reward "${params.rewardName}" has been approved! Enjoy!`,
      type: 'success',
      actionUrl: '/child-dashboard',
      actionText: 'View Rewards',
    });
  },

  // Notify child when reward is denied
  async notifyRewardDenied(params: {
    childId: string;
    rewardName: string;
    points: number;
    familyId: string;
  }): Promise<boolean> {
    return this.createNotification({
      userId: params.childId,
      familyId: params.familyId,
      title: 'Reward Request Denied',
      message: `Your request for "${params.rewardName}" was not approved. Your ${params.points} points have been returned.`,
      type: 'warning',
      actionUrl: '/child-dashboard',
      actionText: 'View Dashboard',
    });
  },

  // Notify about task help request
  async notifyHelpRequested(params: {
    parentId: string;
    childName: string;
    taskName: string;
    helpMessage: string;
    familyId: string;
    taskId?: string;
  }): Promise<boolean> {
    return this.createNotification({
      userId: params.parentId,
      familyId: params.familyId,
      title: 'Help Requested',
      message: `${params.childName} needs help with "${params.taskName}": ${params.helpMessage}`,
      type: 'warning',
      actionUrl: params.taskId ? `/parent-dashboard?highlight=${params.taskId}` : '/parent-dashboard',
      actionText: 'View Task',
    });
  },

  // Notify about overdue task
  async notifyTaskOverdue(params: {
    childId: string;
    taskName: string;
    familyId: string;
    taskId?: string;
  }): Promise<boolean> {
    return this.createNotification({
      userId: params.childId,
      familyId: params.familyId,
      title: 'Task Overdue',
      message: `Your task "${params.taskName}" is overdue. Please complete it soon!`,
      type: 'warning',
      actionUrl: params.taskId ? `/child-dashboard?highlight=${params.taskId}` : '/child-dashboard',
      actionText: 'View Task',
    });
  },

  // Send system message to all family members
  async notifyFamilyMessage(params: {
    userIds: string[];
    familyId: string;
    title: string;
    message: string;
  }): Promise<boolean> {
    try {
      const promises = params.userIds.map(userId =>
        this.createNotification({
          userId,
          familyId: params.familyId,
          title: params.title,
          message: params.message,
          type: 'info',
        })
      );
      
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error sending family message:', error);
      return false;
    }
  },
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
