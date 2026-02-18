"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClientSupabaseClient } from '@/lib/supabaseClient';
import { Notification } from '@/components/NotificationAlert';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  createNotification: (notification: CreateNotificationParams) => Promise<void>;
}

interface CreateNotificationParams {
  userId: string;
  familyId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'task' | 'reward';
  actionUrl?: string;
  actionText?: string;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientSupabaseClient();

  // Convert database notification to UI notification
  const convertNotification = (dbNotif: any): Notification => ({
    id: dbNotif.id,
    title: dbNotif.title,
    message: dbNotif.message,
    type: dbNotif.type,
    timestamp: new Date(dbNotif.created_at),
    read: dbNotif.read,
    actionUrl: dbNotif.action_url,
    actionText: dbNotif.action_text,
  });

  // Fetch notifications directly from Supabase
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.warn('User not authenticated');
        setNotifications([]);
        setError(null);
        setLoading(false);
        return;
      }

      // Fetch notifications from Supabase
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (fetchError) {
        // If table doesn't exist, silently fail
        if (fetchError.message?.includes('does not exist') || fetchError.code === '42P01') {
          console.warn('Notifications table not yet created');
          setNotifications([]);
          setError(null);
          return;
        }
        throw fetchError;
      }
      
      const convertedNotifications = (data || []).map(convertNotification);
      setNotifications(convertedNotifications);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setNotifications([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Mark a notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      setError(err.message);
    }
  }, [supabase]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      setError(err.message);
    }
  }, [supabase]);

  // Dismiss (delete) a notification
  const dismissNotification = useCallback(async (id: string) => {
    try {
      // Check if this is a reward suggestion notification
      const notification = notifications.find(n => n.id === id);
      
      // If it's a reward suggestion, just mark as read (don't delete)
      // This keeps the suggestion visible on the rewards page
      if (notification?.actionUrl === '/rewards-store') {
        await markAsRead(id);
        return;
      }

      // For other notifications, delete them
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Update local state
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    } catch (err: any) {
      console.error('Error dismissing notification:', err);
      setError(err.message);
    }
  }, [supabase, notifications, markAsRead]);

  // Create a new notification
  const createNotification = useCallback(async (params: CreateNotificationParams) => {
    try {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert({
          user_id: params.userId,
          family_id: params.familyId,
          title: params.title,
          message: params.message,
          type: params.type || 'info',
          action_url: params.actionUrl,
          action_text: params.actionText,
          read: false,
        });

      if (insertError) {
        throw insertError;
      }

      // Refresh notifications
      await fetchNotifications();
    } catch (err: any) {
      console.error('Error creating notification:', err);
      setError(err.message);
    }
  }, [supabase, fetchNotifications]);

  // Set up real-time subscription
  useEffect(() => {
    fetchNotifications();

    // Get current user
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Subscribe to real-time updates
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Notification change:', payload);
            
            if (payload.eventType === 'INSERT') {
              // Add new notification only if it's for the current user
              if (payload.new.user_id === user.id) {
                const newNotification = convertNotification(payload.new);
                setNotifications(prev => [newNotification, ...prev]);
              }
            } else if (payload.eventType === 'UPDATE') {
              // Update existing notification only if it's for the current user
              if (payload.new.user_id === user.id) {
                const updatedNotification = convertNotification(payload.new);
                setNotifications(prev =>
                  prev.map(notif =>
                    notif.id === updatedNotification.id ? updatedNotification : notif
                  )
                );
              }
            } else if (payload.eventType === 'DELETE') {
              // Remove notification
              setNotifications(prev =>
                prev.filter(notif => notif.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscription();
  }, [supabase, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    createNotification,
  };
}
