"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from '@/lib/supabaseClient';
import ProfileIcon from "@/app/components/ProfileIcon";

interface Activity {
  id: string;
  family_id: string;
  user_id: string;
  activity_type: string;
  title: string;
  description: string | null;
  metadata: Record<string, any>;
  image_url: string | null;
  is_pinned: boolean;
  created_at: string;
  user_name: string;
  user_role: string;
  reaction_count: number;
  comment_count: number;
}

interface Reaction {
  id: string;
  activity_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}

interface Comment {
  id: string;
  activity_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  user_name?: string;
}

const reactionEmojis: Record<string, string> = {
  like: '👍',
  love: '❤️',
  celebrate: '🎉',
  wow: '😮',
  fire: '🔥'
};

export default function ActivityFeedPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [familyId, setFamilyId] = useState<string>("");
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [userReactions, setUserReactions] = useState<Record<string, string>>({});
  const [alertModal, setAlertModal] = useState({ show: false, message: "", type: "info" as "info" | "success" | "error" | "warning" });
  const [confirmModal, setConfirmModal] = useState({ show: false, message: "", onConfirm: () => {}, onCancel: () => {} });

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const supabase = createClientSupabaseClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name, family_id')
      .eq('id', session.user.id)
      .single();

    if (profile) {
      setUserRole(profile.role);
      setUserName(profile.full_name);
      setUserId(session.user.id);
      setFamilyId(profile.family_id || "");
    }

    loadActivities(session.user.id, profile?.family_id || "");
  };

  const showAlert = (message: string, type: "info" | "success" | "error" | "warning" = "info") => {
    setAlertModal({ show: true, message, type });
  };

  const showConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmModal({
        show: true,
        message,
        onConfirm: () => {
          setConfirmModal({ show: false, message: "", onConfirm: () => {}, onCancel: () => {} });
          resolve(true);
        },
        onCancel: () => {
          setConfirmModal({ show: false, message: "", onConfirm: () => {}, onCancel: () => {} });
          resolve(false);
        }
      });
    });
  };

  const loadActivities = async (currentUserId?: string, currentFamilyId?: string) => {
    const supabase = createClientSupabaseClient();
    const userIdToUse = currentUserId || userId;
    const familyIdToUse = currentFamilyId || familyId;

    if (!familyIdToUse) {
      setActivities([]);
      setLoading(false);
      return;
    }
    
    // Load activities with stats
    const { data, error } = await supabase
      .from('activity_feed_with_stats')
      .select('*')
      .eq('family_id', familyIdToUse)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading activities:', error);
    } else {
      setActivities(data || []);
      
      // Load user's reactions - use passed userId to avoid stale state
      if (data && userIdToUse) {
        const activityIds = data.map(a => a.id);
        const { data: reactions } = await supabase
          .from('activity_reactions')
          .select('activity_id, reaction_type')
          .eq('user_id', userIdToUse)
          .in('activity_id', activityIds);

        if (reactions) {
          const reactionsMap: Record<string, string> = {};
          reactions.forEach(r => {
            reactionsMap[r.activity_id] = r.reaction_type;
          });
          setUserReactions(reactionsMap);
        }
      }
    }
    
    setLoading(false);
  };

  const toggleReaction = async (activityId: string, reactionType: string) => {
    const supabase = createClientSupabaseClient();
    const currentReaction = userReactions[activityId];

    if (currentReaction === reactionType) {
      // Remove reaction
      await supabase
        .from('activity_reactions')
        .delete()
        .eq('activity_id', activityId)
        .eq('user_id', userId);

      setUserReactions(prev => {
        const updated = { ...prev };
        delete updated[activityId];
        return updated;
      });
    } else {
      // Delete old reaction first, then insert new one
      await supabase
        .from('activity_reactions')
        .delete()
        .eq('activity_id', activityId)
        .eq('user_id', userId);

      // Insert new reaction
      await supabase
        .from('activity_reactions')
        .insert({
          activity_id: activityId,
          user_id: userId,
          reaction_type: reactionType
        });

      setUserReactions(prev => ({
        ...prev,
        [activityId]: reactionType
      }));
    }

    loadActivities();
  };

  const loadComments = async (activityId: string) => {
    const supabase = createClientSupabaseClient();
    
    const { data, error } = await supabase
      .from('activity_comments')
      .select(`
        *,
        profiles!activity_comments_user_id_fkey(full_name)
      `)
      .eq('activity_id', activityId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading comments:', error);
    } else {
      const commentsWithNames = data?.map(c => ({
        ...c,
        user_name: (c.profiles as any)?.full_name || 'Unknown'
      })) || [];
      
      setComments(prev => ({
        ...prev,
        [activityId]: commentsWithNames
      }));
    }
  };

  const toggleComments = (activityId: string) => {
    if (expandedActivity === activityId) {
      setExpandedActivity(null);
    } else {
      setExpandedActivity(activityId);
      if (!comments[activityId]) {
        loadComments(activityId);
      }
    }
  };

  const addComment = async (activityId: string) => {
    const commentText = newComment[activityId]?.trim();
    if (!commentText) return;

    const supabase = createClientSupabaseClient();
    
    await supabase
      .from('activity_comments')
      .insert({
        activity_id: activityId,
        user_id: userId,
        comment_text: commentText
      });

    // Clear input
    setNewComment(prev => ({
      ...prev,
      [activityId]: ''
    }));

    // Reload comments
    loadComments(activityId);
    loadActivities();
  };

  const deleteActivity = async (activityId: string) => {
    const confirmed = await showConfirm('Are you sure you want to delete this activity? This cannot be undone.');
    if (!confirmed) return;

    const supabase = createClientSupabaseClient();
    
    const { error } = await supabase
      .from('activity_feed')
      .delete()
      .eq('id', activityId);

    if (error) {
      console.error('Error deleting activity:', error);
      showAlert('Failed to delete activity', 'error');
      return;
    }

    // Remove from local state
    setActivities(activities.filter(a => a.id !== activityId));
    showAlert('Activity deleted successfully', 'success');
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      task_completed: '✅',
      task_approved: '⭐',
      achievement_earned: '🏆',
      reward_redeemed: '🎁',
      level_up: '📈',
      streak_milestone: '🔥',
      announcement: '📢',
      birthday: '🎂'
    };
    return icons[type] || '📝';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading activity feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-white">
      <ProfileIcon />
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold">📰 Activity Feed</h1>
                <p className="text-cyan-100 text-sm">See what's happening in your family</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-cyan-100">{userName}</p>
              <p className="text-xs text-cyan-200">{userRole === 'parent' ? 'Parent' : 'Child'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-600 text-lg">No activities yet</p>
            <p className="text-gray-500 text-sm mt-2">Complete tasks to start seeing activity!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`bg-white rounded-xl shadow-md p-6 transition-all hover:shadow-lg ${
                  activity.is_pinned ? 'border-2 border-cyan-400' : ''
                }`}
              >
                {/* Pinned Badge */}
                {activity.is_pinned && (
                  <div className="flex items-center text-cyan-600 text-sm font-semibold mb-3">
                    📌 Pinned
                  </div>
                )}

                {/* Activity Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="text-3xl">{getActivityIcon(activity.activity_type)}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                      {activity.description && (
                        <p className="text-gray-600 text-sm mt-1">{activity.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{activity.user_name}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(activity.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  {/* Delete button - only for activity creator or parents */}
                  {(activity.user_id === userId || userRole === 'parent') && (
                    <button
                      onClick={() => deleteActivity(activity.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors ml-2 p-2 hover:bg-red-50 rounded-lg"
                      title="Delete activity"
                    >
                      <i className="fas fa-trash text-sm"></i>
                    </button>
                  )}
                </div>

                {/* Image if available */}
                {activity.image_url && (
                  <img
                    src={activity.image_url}
                    alt="Activity"
                    className="w-full h-64 object-cover rounded-lg mb-4"
                  />
                )}

                {/* Reactions Bar */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    {Object.entries(reactionEmojis).map(([type, emoji]) => (
                      <button
                        key={type}
                        onClick={() => toggleReaction(activity.id, type)}
                        className={`px-3 py-2 rounded-lg transition-all hover:scale-105 ${
                          userReactions[activity.id] === type
                            ? 'bg-cyan-100 text-cyan-700 scale-110 ring-2 ring-cyan-300'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                        }`}
                        title={
                          userReactions[activity.id] === type 
                            ? `You reacted with ${type}. Click to remove or choose another.`
                            : `React with ${type}`
                        }
                      >
                        <span className="text-lg">{emoji}</span>
                      </button>
                    ))}
                    {activity.reaction_count > 0 && (
                      <span className="text-sm text-gray-500 ml-2">
                        {activity.reaction_count}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => toggleComments(activity.id)}
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-cyan-600 transition"
                  >
                    <span>💬</span>
                    <span>{activity.comment_count} Comments</span>
                  </button>
                </div>

                {/* Comments Section */}
                {expandedActivity === activity.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {/* Existing Comments */}
                    <div className="space-y-3 mb-4">
                      {comments[activity.id]?.map((comment) => (
                        <div key={comment.id} className="flex space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {comment.user_name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-700">{comment.user_name}</p>
                            <p className="text-sm text-gray-800 mt-1">{comment.comment_text}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimeAgo(comment.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Comment */}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newComment[activity.id] || ''}
                        onChange={(e) => setNewComment(prev => ({
                          ...prev,
                          [activity.id]: e.target.value
                        }))}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addComment(activity.id);
                          }
                        }}
                        placeholder="Write a comment..."
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                      <button
                        onClick={() => addComment(activity.id)}
                        className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-lg hover:shadow-lg transition font-semibold"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-around items-center">
            <Link
              href={userRole === 'parent' ? '/parent-dashboard' : '/child-dashboard'}
              className="flex flex-col items-center text-gray-600 hover:text-cyan-600 transition"
            >
              <span className="text-2xl">🏠</span>
              <span className="text-xs mt-1">Home</span>
            </Link>
            <Link
              href="/activity-feed"
              className="flex flex-col items-center text-cyan-600"
            >
              <span className="text-2xl">📰</span>
              <span className="text-xs mt-1 font-semibold">Activity</span>
            </Link>
            <Link
              href="/achievements"
              className="flex flex-col items-center text-gray-600 hover:text-cyan-600 transition"
            >
              <span className="text-2xl">🏆</span>
              <span className="text-xs mt-1">Badges</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom padding to prevent footer overlap */}
      <div className="h-20"></div>

      {/* Alert Modal */}
      {alertModal.show && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setAlertModal({ show: false, message: "", type: "info" })}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-6 ${
              alertModal.type === "error" ? "bg-red-50" :
              alertModal.type === "success" ? "bg-green-50" :
              alertModal.type === "warning" ? "bg-yellow-50" :
              "bg-blue-50"
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`text-3xl ${
                  alertModal.type === "error" ? "text-red-500" :
                  alertModal.type === "success" ? "text-green-500" :
                  alertModal.type === "warning" ? "text-yellow-500" :
                  "text-blue-500"
                }`}>
                  {alertModal.type === "error" && "❌"}
                  {alertModal.type === "success" && "✅"}
                  {alertModal.type === "warning" && "⚠️"}
                  {alertModal.type === "info" && "ℹ️"}
                </div>
                <p className="text-gray-800 font-medium flex-1">{alertModal.message}</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => setAlertModal({ show: false, message: "", type: "info" })}
                className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-lg font-medium hover:shadow-lg transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.show && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={confirmModal.onCancel}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50">
              <div className="flex items-start space-x-3">
                <div className="text-3xl text-orange-500">⚠️</div>
                <p className="text-gray-800 font-medium flex-1 mt-1">{confirmModal.message}</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={confirmModal.onCancel}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:shadow-lg transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
