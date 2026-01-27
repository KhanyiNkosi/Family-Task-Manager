"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, BellIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

export type NotificationType = "info" | "success" | "warning" | "error" | "task" | "reward";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

interface NotificationAlertProps {
  notifications: Notification[];
  onDismiss?: (id: string) => void;
  onMarkAsRead?: (id: string) => void;
  maxNotifications?: number;
  autoClose?: number; // milliseconds
}

export default function NotificationAlert({
  notifications,
  onDismiss,
  onMarkAsRead,
  maxNotifications = 3,
  autoClose = 5000
}: NotificationAlertProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter unread notifications and limit the number shown
  useEffect(() => {
    const unreadNotifications = notifications
      .filter(notif => !notif.read)
      .slice(0, isExpanded ? notifications.length : maxNotifications);
    
    setVisibleNotifications(unreadNotifications);
  }, [notifications, isExpanded, maxNotifications]);

  // Auto-close notifications
  useEffect(() => {
    if (autoClose > 0 && visibleNotifications.length > 0) {
      const timer = setTimeout(() => {
        visibleNotifications.forEach(notif => {
          if (onDismiss) onDismiss(notif.id);
        });
      }, autoClose);

      return () => clearTimeout(timer);
    }
  }, [visibleNotifications, autoClose, onDismiss]);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "success":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "warning":
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case "error":
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case "task":
        return <BellIcon className="h-5 w-5 text-blue-500" />;
      case "reward":
        return <CheckCircleIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-[#00C2E0]" />;
    }
  };

  const getBgColor = (type: NotificationType) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "task":
        return "bg-blue-50 border-blue-200";
      case "reward":
        return "bg-purple-50 border-purple-200";
      default:
        return "bg-[#F0F9FF] border-[#00C2E0]/30";
    }
  };

  const handleDismiss = (id: string) => {
    if (onDismiss) {
      onDismiss(id);
    }
  };

  const handleMarkAsRead = (id: string) => {
    if (onMarkAsRead) {
      onMarkAsRead(id);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (visibleNotifications.length === 0 && !isExpanded) {
    return null;
  }

  return (
    <div className="fixed top-24 right-6 z-50 w-80 sm:w-96 space-y-3">
      {/* Notification Bell with Counter */}
      <div className="flex justify-end mb-2">
        <div className="relative">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
          >
            <BellIcon className="h-6 w-6 text-[#006372]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className={`transition-all duration-300 ${isExpanded ? 'max-h-96 overflow-y-auto' : 'max-h-0 overflow-hidden'}`}>
        {isExpanded && (
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-lg text-[#006372]">Notifications</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-3 rounded-xl mb-2 border ${getBgColor(notification.type)} ${notification.read ? 'opacity-70' : ''}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    {notification.actionUrl && (
                      <a
                        href={notification.actionUrl}
                        className="inline-block mt-2 text-sm font-medium text-[#00C2E0] hover:text-[#00a8c2]"
                      >
                        {notification.actionText || "View Details"}
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col space-y-1 ml-2">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-xs text-gray-500 hover:text-[#00C2E0]"
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      onClick={() => handleDismiss(notification.id)}
                      className="text-xs text-gray-500 hover:text-red-500"
                      title="Dismiss"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Notifications (when not expanded) */}
      {!isExpanded && visibleNotifications.map(notification => (
        <div
          key={notification.id}
          className={`p-4 rounded-xl shadow-lg border transform transition-all duration-300 hover:scale-[1.02] ${getBgColor(notification.type)}`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                <button
                  onClick={() => handleDismiss(notification.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
              {notification.actionUrl && (
                <a
                  href={notification.actionUrl}
                  className="inline-block mt-2 text-sm font-medium text-[#00C2E0] hover:text-[#00a8c2]"
                >
                  {notification.actionText || "View Details"}
                </a>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Show All / Collapse Button */}
      {notifications.length > maxNotifications && (
        <div className="text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-[#00C2E0] hover:text-[#00a8c2] font-medium"
          >
            {isExpanded ? "Show less" : `Show all (${notifications.length})`}
          </button>
        </div>
      )}
    </div>
  );
}
