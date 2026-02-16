"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NotificationAlert from '@/components/NotificationAlert';
import { useNotifications } from '@/hooks/useNotifications';
import { usePremium } from '@/hooks/usePremium';
import { createClientSupabaseClient } from '@/lib/supabaseClient';

interface Task {
  id: string;
  title: string;
  description?: string;
  points: number;
  completed: boolean;
  approved?: boolean;
  due_date?: string;
  created_at: string;
  completed_at?: string;
  category?: string;
  assigned_to?: string;
  created_by?: string;
}

interface Reward {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  family_id: string;
  is_active: boolean;
}

interface RewardRedemption {
  id: string;
  reward_id: string;
  user_id: string;
  points_spent: number;
  status: 'pending' | 'approved' | 'rejected';
  redeemed_at: string;
  reward?: Reward;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  earned: boolean;
  earnedDate?: string;
  color: string;
}

export default function ParentTasksPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [userName, setUserName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  
  // Data states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [points, setPoints] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [approvedTasksCount, setApprovedTasksCount] = useState(0);
  
  // UI states
  const [activeTab, setActiveTab] = useState<'tasks' | 'rewards' | 'activity' | 'badges'>('tasks');
  const [alertModal, setAlertModal] = useState({ show: false, message: "", type: "info" as "info" | "success" | "error" | "warning" });
  const [confirmModal, setConfirmModal] = useState({ show: false, message: "", onConfirm: () => {} });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Use notifications hook
  const { notifications, unreadCount, markAsRead, dismissNotification } = useNotifications();
  
  // Premium status
  const { isPremium, isLoading: premiumLoading } = usePremium();

  // Modal helpers
  const showAlert = (message: string, type: "info" | "success" | "error" | "warning" = "info") => {
    setAlertModal({ show: true, message, type });
  };

  const showConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmModal({
        show: true,
        message,
        onConfirm: () => {
          setConfirmModal({ show: false, message: "", onConfirm: () => {} });
          resolve(true);
        },
      });
      setTimeout(() => {
        (window as any)._confirmCancelHandler = () => resolve(false);
      }, 0);
    });
  };

  // Load user data
  useEffect(() => {
    setIsClient(true);
    loadUserProfile();
    loadTasks();
    loadRewards();
    loadRedemptions();
    calculatePoints();
    loadBadges();

    // Set up real-time subscriptions
    const setupSubscriptions = async () => {
      const supabase = createClientSupabaseClient();
      
      const tasksSubscription = supabase
        .channel('parent_tasks')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
          loadTasks();
          calculatePoints();
          loadBadges();
        })
        .subscribe();

      const redemptionsSubscription = supabase
        .channel('parent_redemptions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_redemptions' }, () => {
          loadRedemptions();
          calculatePoints();
        })
        .subscribe();

      const rewardsSubscription = supabase
        .channel('parent_rewards')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards' }, () => {
          loadRewards();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(tasksSubscription);
        supabase.removeChannel(redemptionsSubscription);
        supabase.removeChannel(rewardsSubscription);
      };
    };

    if (isClient) {
      setupSubscriptions();
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, profile_image, role')
        .eq('id', user.id)
        .single();

      if (profile) {
        // Check if user is a parent
        if (profile.role !== 'parent') {
          showAlert('Access denied! This page is for parents only.', 'error');
          router.push('/child-dashboard');
          return;
        }

        setUserName(profile.full_name || '');
        setProfileImage(profile.profile_image || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: tasksData, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tasks:', error);
        return;
      }

      setTasks(tasksData || []);
      
      // Count approved tasks
      const approvedCount = tasksData?.filter(t => t.approved).length || 0;
      setApprovedTasksCount(approvedCount);
    } catch (error) {
      console.error('Error in loadTasks:', error);
    }
  };

  const loadRewards = async () => {
    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user.id)
        .single();

      if (!profile?.family_id) return;

      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('*')
        .eq('family_id', profile.family_id)
        .eq('is_active', true)
        .order('points_cost', { ascending: true });

      setRewards(rewardsData || []);
    } catch (error) {
      console.error('Error loading rewards:', error);
    }
  };

  const loadRedemptions = async () => {
    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: redemptionsData } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          reward:rewards(*)
        `)
        .eq('user_id', user.id)
        .order('redeemed_at', { ascending: false });

      setRedemptions(redemptionsData || []);
    } catch (error) {
      console.error('Error loading redemptions:', error);
    }
  };

  const calculatePoints = async () => {
    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Calculate points from approved tasks
      const { data: approvedTasks } = await supabase
        .from('tasks')
        .select('points')
        .eq('assigned_to', user.id)
        .eq('approved', true);

      const earnedPoints = approvedTasks?.reduce((sum, task) => sum + (task.points || 0), 0) || 0;

      // Calculate points spent on approved redemptions
      const { data: approvedRedemptions } = await supabase
        .from('reward_redemptions')
        .select('points_spent')
        .eq('user_id', user.id)
        .eq('status', 'approved');

      const spentPoints = approvedRedemptions?.reduce((sum, r) => sum + (r.points_spent || 0), 0) || 0;

      setPoints(earnedPoints - spentPoints);
    } catch (error) {
      console.error('Error calculating points:', error);
    }
  };

  const loadBadges = async () => {
    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Define badge criteria with colors
      const badgeDefinitions = [
        { id: '1', name: 'First Steps', description: 'Complete your first task', icon: 'fa-star', requirement: 1, color: 'from-blue-400 to-blue-600' },
        { id: '2', name: 'Task Master', description: 'Complete 10 tasks', icon: 'fa-trophy', requirement: 10, color: 'from-amber-400 to-amber-600' },
        { id: '3', name: 'Super Parent', description: 'Complete 25 tasks', icon: 'fa-medal', requirement: 25, color: 'from-purple-400 to-purple-600' },
        { id: '4', name: 'Legend', description: 'Complete 50 tasks', icon: 'fa-crown', requirement: 50, color: 'from-yellow-400 to-yellow-600' },
        { id: '5', name: 'Point Collector', description: 'Earn 100 points', icon: 'fa-coins', requirement: 100, color: 'from-green-400 to-green-600' },
        { id: '6', name: 'Achievement Hunter', description: 'Earn all badges', icon: 'fa-gem', requirement: 6, color: 'from-pink-400 to-pink-600' },
      ];

      const completedTasks = approvedTasksCount;
      
      const badgesWithStatus = badgeDefinitions.map(badge => {
        const earned = badge.id === '5' ? points >= badge.requirement : 
                       badge.id === '6' ? completedTasks >= 50 : // All other badges
                       completedTasks >= badge.requirement;
        return {
          ...badge,
          earned,
          earnedDate: earned ? new Date().toISOString() : undefined
        };
      });

      setBadges(badgesWithStatus);
    } catch (error) {
      console.error('Error loading badges:', error);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const supabase = createClientSupabaseClient();
      
      const confirmed = await showConfirm("Mark this task as completed? It will need parent approval to earn points.");
      if (!confirmed) return;

      const { error } = await supabase
        .from('tasks')
        .update({ 
          completed: true, 
          completed_at: new Date().toISOString() 
        })
        .eq('id', taskId);

      if (error) {
        showAlert('Failed to complete task', 'error');
        return;
      }

      showAlert('Task marked as completed! Waiting for approval.', 'success');
      await loadTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      showAlert('Failed to complete task', 'error');
    }
  };

  const handleRedeemReward = async (reward: Reward) => {
    try {
      if (points < reward.points_cost) {
        showAlert(`Not enough points! You need ${reward.points_cost - points} more points.`, 'warning');
        return;
      }

      const confirmed = await showConfirm(`Redeem "${reward.title}" for ${reward.points_cost} points?`);
      if (!confirmed) return;

      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from('reward_redemptions')
        .insert({
          reward_id: reward.id,
          user_id: user.id,
          points_spent: reward.points_cost,
          status: 'pending',
          redeemed_at: new Date().toISOString()
        });

      if (error) {
        showAlert('Failed to redeem reward', 'error');
        return;
      }

      showAlert('Reward redeemed! Waiting for parent approval.', 'success');
      await loadRedemptions();
    } catch (error) {
      console.error('Error redeeming reward:', error);
      showAlert('Failed to redeem reward', 'error');
    }
  };

  // Get category counts
  const categoryCount = tasks.filter(t => !t.approved).reduce((acc, task) => {
    const category = task.category || 'general';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-cyan-50">
      {/* Notification Alert */}
      <NotificationAlert 
        notifications={notifications}
        onDismiss={dismissNotification}
        onMarkAsRead={markAsRead}
        maxNotifications={3}
        autoClose={8000}
      />

      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/parent-dashboard" className="flex items-center gap-2 hover:opacity-80 transition mr-4">
                <i className="fas fa-arrow-left text-xl"></i>
                <span className="hidden md:inline">Back</span>
              </Link>
              <Link href="/" className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <i className="fas fa-smile text-2xl"></i>
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold">FamilyTask</h1>
                  <p className="text-white/80 text-sm">My Tasks & Rewards</p>
                </div>
              </Link>
            </div>

            {/* Stats Overview */}
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <p className="text-white/80 text-sm">Points</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <i className="fas fa-star text-yellow-300"></i>
                  {points}
                </p>
              </div>
              <div className="text-center">
                <p className="text-white/80 text-sm">Tasks Done</p>
                <p className="text-2xl font-bold">{approvedTasksCount}</p>
              </div>
              <div className="text-center">
                <p className="text-white/80 text-sm">Active</p>
                <p className="text-2xl font-bold">{tasks.filter(t => !t.completed && !t.approved).length}</p>
              </div>
              {!isPremium && !premiumLoading && (
                <div className="text-center">
                  <p className="text-white/80 text-sm">Plan</p>
                  <p className="text-lg font-bold">Free (3 max)</p>
                </div>
              )}
            </div>

            {/* Profile */}
            <Link 
              href="/parent-profile"
              className="flex items-center justify-center w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full transition-all overflow-hidden border-2 border-white/30"
              title="My Profile"
            >
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <i className="fas fa-user text-xl"></i>
              )}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Welcome Section */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-purple-100">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {userName || 'Parent'}! 👋
          </h2>
          <p className="text-gray-600">
            Track your tasks, redeem rewards, and manage your family activities all in one place.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-2 border border-purple-100">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'tasks', icon: 'fa-tasks', label: 'My Tasks', count: tasks.filter(t => !t.approved).length },
              { id: 'rewards', icon: 'fa-gift', label: 'Rewards', count: rewards.length },
              { id: 'activity', icon: 'fa-history', label: 'Activity', count: redemptions.length },
              { id: 'badges', icon: 'fa-trophy', label: 'Badges', count: badges.filter(b => b.earned).length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <i className={`fas ${tab.icon} mr-2`}></i>
                {tab.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-purple-100 text-purple-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Free Tier Notice */}
            {!isPremium && !premiumLoading && tasks.filter(t => !t.approved).length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-white text-2xl flex-shrink-0">
                    <i className="fas fa-info-circle"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Free Tier Limits</h3>
                    <p className="text-gray-700 mb-3">
                      You have <strong>{tasks.filter(t => !t.approved).length} of 3</strong> active tasks. Upgrade to Premium for unlimited tasks, goals, and more!
                    </p>
                    <Link
                      href="/pricing"
                      className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      <i className="fas fa-crown"></i>
                      Upgrade to Premium
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">To Do</p>
                    <p className="text-3xl font-bold">{tasks.filter(t => !t.completed && !t.approved).length}</p>
                  </div>
                  <i className="fas fa-list-check text-4xl opacity-50"></i>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">Completed</p>
                    <p className="text-3xl font-bold">{tasks.filter(t => t.completed && !t.approved).length}</p>
                  </div>
                  <i className="fas fa-check-circle text-4xl opacity-50"></i>
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">Approved</p>
                    <p className="text-3xl font-bold">{approvedTasksCount}</p>
                  </div>
                  <i className="fas fa-star text-4xl opacity-50"></i>
                </div>
              </div>
            </div>

            {/* Tasks List */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-100">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <i className="fas fa-tasks text-purple-600"></i>
                My Tasks
              </h3>

              {tasks.filter(t => !t.approved).length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-clipboard-check text-6xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500 text-lg">No active tasks</p>
                  <p className="text-gray-400 text-sm">All caught up! Great job! 🎉</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.filter(t => !t.approved).map(task => (
                    <div 
                      key={task.id}
                      className={`p-5 rounded-xl border-2 transition-all ${
                        task.completed
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200 hover:border-purple-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className={`text-lg font-bold ${task.completed ? 'text-green-700 line-through' : 'text-gray-800'}`}>
                              {task.title}
                            </h4>
                            {task.category && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium capitalize">
                                {task.category}
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-amber-600 font-semibold">
                              <i className="fas fa-star"></i>
                              {task.points} points
                            </span>
                            {task.due_date && (
                              <span className="flex items-center gap-1 text-gray-500">
                                <i className="fas fa-calendar"></i>
                                {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                            {task.completed && (
                              <span className="flex items-center gap-1 text-green-600">
                                <i className="fas fa-clock"></i>
                                Waiting approval
                              </span>
                            )}
                          </div>
                        </div>
                        {!task.completed && (
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                          >
                            <i className="fas fa-check"></i>
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            {/* Points Balance */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-8 rounded-2xl shadow-lg text-center">
              <p className="text-white/80 text-lg mb-2">Your Balance</p>
              <p className="text-5xl font-bold flex items-center justify-center gap-3">
                <i className="fas fa-coins"></i>
                {points} Points
              </p>
            </div>

            {/* Available Rewards */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-100">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <i className="fas fa-gift text-purple-600"></i>
                Available Rewards
              </h3>

              {rewards.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-gift text-6xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500 text-lg">No rewards available yet</p>
                  <p className="text-gray-400 text-sm">Check back later!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rewards.map(reward => {
                    const canAfford = points >= reward.points_cost;
                    return (
                      <div 
                        key={reward.id}
                        className={`p-5 rounded-xl border-2 transition-all ${
                          canAfford
                            ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:shadow-lg'
                            : 'bg-gray-50 border-gray-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-xl">
                            <i className="fas fa-gift"></i>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-800">{reward.title}</h4>
                            <p className="text-sm text-amber-600 font-semibold flex items-center gap-1">
                              <i className="fas fa-coins"></i>
                              {reward.points_cost} points
                            </p>
                          </div>
                        </div>
                        {reward.description && (
                          <p className="text-gray-600 text-sm mb-4">{reward.description}</p>
                        )}
                        <button
                          onClick={() => handleRedeemReward(reward)}
                          disabled={!canAfford}
                          className={`w-full py-2.5 rounded-xl font-semibold transition-all ${
                            canAfford
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {canAfford ? (
                            <>
                              <i className="fas fa-shopping-cart mr-2"></i>
                              Redeem
                            </>
                          ) : (
                            <>
                              <i className="fas fa-lock mr-2"></i>
                              Need {reward.points_cost - points} more
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <i className="fas fa-history text-purple-600"></i>
              Recent Activity
            </h3>

            {redemptions.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-history text-6xl text-gray-300 mb-4"></i>
                <p className="text-gray-500 text-lg">No activity yet</p>
                <p className="text-gray-400 text-sm">Your reward redemptions will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {redemptions.map(redemption => (
                  <div key={redemption.id} className="p-5 rounded-xl border-2 border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 mb-1">
                          {redemption.reward?.title || 'Reward'}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {redemption.reward?.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-amber-600 font-semibold flex items-center gap-1">
                            <i className="fas fa-coins"></i>
                            {redemption.points_spent} points
                          </span>
                          <span className="text-gray-500">
                            {new Date(redemption.redeemed_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-xl font-semibold text-sm ${
                        redemption.status === 'approved' ? 'bg-green-100 text-green-700' :
                        redemption.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {redemption.status === 'approved' ? '✓ Approved' :
                         redemption.status === 'rejected' ? '✕ Rejected' :
                         '⏳ Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <i className="fas fa-trophy text-purple-600"></i>
              My Badges
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {badges.map(badge => (
                <div 
                  key={badge.id}
                  className={`p-6 rounded-2xl border-2 transition-all text-center ${
                    badge.earned
                      ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 shadow-lg'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-4xl ${
                    badge.earned
                      ? `bg-gradient-to-r ${badge.color} text-white shadow-xl ring-4 ring-white`
                      : 'bg-gray-300 text-gray-500'
                  }`}>
                    <i className={`fas ${badge.icon}`}></i>
                  </div>
                  <h4 className="font-bold text-lg text-gray-800 mb-2">{badge.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
                  {badge.earned ? (
                    <span className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold text-sm">
                      <i className="fas fa-check-circle mr-1"></i>
                      Earned!
                    </span>
                  ) : (
                    <span className="inline-block px-4 py-2 bg-gray-200 text-gray-600 rounded-lg font-medium text-sm">
                      <i className="fas fa-lock mr-1"></i>
                      Locked
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Navigation */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-purple-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/parent-dashboard"
              className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 hover:shadow-lg transition-all text-center"
            >
              <i className="fas fa-chart-line text-3xl text-blue-600 mb-2"></i>
              <p className="font-semibold text-gray-800">Dashboard</p>
            </Link>
            <Link
              href="/parent-goals"
              className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 hover:shadow-lg transition-all text-center"
            >
              <i className="fas fa-bullseye text-3xl text-indigo-600 mb-2"></i>
              <p className="font-semibold text-gray-800">My Goals</p>
            </Link>
            <Link
              href="/rewards-store"
              className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 hover:shadow-lg transition-all text-center"
            >
              <i className="fas fa-store text-3xl text-purple-600 mb-2"></i>
              <p className="font-semibold text-gray-800">Rewards Store</p>
            </Link>
            <Link
              href="/settings"
              className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 hover:shadow-lg transition-all text-center"
            >
              <i className="fas fa-cog text-3xl text-amber-600 mb-2"></i>
              <p className="font-semibold text-gray-800">Settings</p>
            </Link>
            <Link
              href="/parent-profile"
              className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 hover:shadow-lg transition-all text-center"
            >
              <i className="fas fa-user text-3xl text-green-600 mb-2"></i>
              <p className="font-semibold text-gray-800">My Profile</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Alert Modal */}
      {alertModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn" onClick={() => setAlertModal({ ...alertModal, show: false })}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
              alertModal.type === "success" ? "bg-green-100" :
              alertModal.type === "error" ? "bg-red-100" :
              alertModal.type === "warning" ? "bg-yellow-100" :
              "bg-blue-100"
            }`}>
              <span className="text-3xl">{
                alertModal.type === "success" ? "✓" :
                alertModal.type === "error" ? "✕" :
                alertModal.type === "warning" ? "⚠" :
                "ℹ"
              }</span>
            </div>
            <h3 className={`text-xl font-bold text-center mb-2 ${
              alertModal.type === "success" ? "text-green-600" :
              alertModal.type === "error" ? "text-red-600" :
              alertModal.type === "warning" ? "text-yellow-600" :
              "text-blue-600"
            }`}>
              {alertModal.type === "success" ? "Success!" :
               alertModal.type === "error" ? "Error" :
               alertModal.type === "warning" ? "Warning" :
               "Information"}
            </h3>
            <p className="text-gray-700 text-center mb-6">{alertModal.message}</p>
            <button
              onClick={() => setAlertModal({ ...alertModal, show: false })}
              className={`w-full py-3 rounded-xl font-bold text-white transition ${
                alertModal.type === "success" ? "bg-green-500 hover:bg-green-600" :
                alertModal.type === "error" ? "bg-red-500 hover:bg-red-600" :
                alertModal.type === "warning" ? "bg-yellow-500 hover:bg-yellow-600" :
                "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scaleIn">
            <div className="w-16 h-16 rounded-full bg-yellow-100 mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl">?</span>
            </div>
            <h3 className="text-xl font-bold text-center mb-2 text-gray-800">Confirm Action</h3>
            <p className="text-gray-700 text-center mb-6">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirmModal({ show: false, message: "", onConfirm: () => {} });
                  if ((window as any)._confirmCancelHandler) {
                    (window as any)._confirmCancelHandler();
                  }
                }}
                className="flex-1 py-3 rounded-xl font-bold bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 transition"
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
