"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from '@/lib/supabaseClient';
import PremiumGuard from '@/components/PremiumGuard';
import { usePremium } from '@/hooks/usePremium';

interface Reward {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  family_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_default?: boolean;
}

interface RewardSuggestion {
  id: string;
  title: string;
  message: string;
  created_at: string;
  metadata: {
    reward_name: string;
    reward_description: string;
    suggested_points: number;
    suggested_by: string;
    suggested_by_name: string;
  };
}

interface RewardRedemption {
  id: string;
  reward_id: string;
  user_id: string;
  points_spent: number;
  status: 'pending' | 'approved' | 'rejected';
  redeemed_at: string;
  approved_at: string | null;
  approved_by: string | null;
  reward?: Reward;
  user?: { id: string; full_name: string };
}

export default function RewardsStorePage() {
  const router = useRouter();
  const { isPremium } = usePremium();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [suggestions, setSuggestions] = useState<RewardSuggestion[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [newRewardTitle, setNewRewardTitle] = useState("");
  const [newRewardDescription, setNewRewardDescription] = useState("");
  const [newRewardPoints, setNewRewardPoints] = useState("50");
  const [profileImage, setProfileImage] = useState("");

  // Modal states
  const [alertModal, setAlertModal] = useState<{ show: boolean; message: string; type: "success" | "error" | "warning" | "info" }>({ show: false, message: "", type: "info" });
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; message: string; onConfirm: () => void }>({ show: false, message: "", onConfirm: () => {} });

  // Modal helper functions
  const showAlert = (message: string, type: "success" | "error" | "warning" | "info" = "info") => {
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
      // Handle cancel
      setTimeout(() => {
        const cancelHandler = () => {
          resolve(false);
        };
        (window as any)._confirmCancelHandler = cancelHandler;
      }, 0);
    });
  };

  useEffect(() => {
    loadRewards();
    loadSuggestions();
    loadRedemptions();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProfileImage = async () => {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (isMounted) {
          setProfileImage("");
        }
        return;
      }

      const storageKey = `parentProfileImage:${user.id}`;
      const savedImage = localStorage.getItem(storageKey) || "";
      if (isMounted) {
        setProfileImage(savedImage);
      }
    };

    loadProfileImage();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadRewards = async () => {
    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get user's family_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user.id)
        .single();

      if (!profile?.family_id) return;

      // Load all active rewards for this family
      const { data: rewardsData, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('family_id', profile.family_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading rewards:', error);
        return;
      }

      if (rewardsData) {
        setRewards(rewardsData);
      }
    } catch (error) {
      // Ignore AbortError - normal when navigating away
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Error in loadRewards:', error);
    }
  };

  const handleCreateReward = async () => {
    if (!newRewardTitle.trim()) {
      showAlert('Please enter a reward title', "warning");
      return;
    }

    const pointsCost = parseInt(newRewardPoints);
    if (isNaN(pointsCost) || pointsCost <= 0) {
      showAlert('Please enter a valid points cost', "warning");
      return;
    }

    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showAlert('You must be logged in to create rewards', "error");
        return;
      }

      // Get user's family_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user.id)
        .single();

      if (!profile?.family_id) {
        showAlert('Family ID not found', "error");
        return;
      }

      // Insert reward into database
      const { data: newReward, error } = await supabase
        .from('rewards')
        .insert({
          title: newRewardTitle.trim(),
          description: newRewardDescription.trim() || null,
          points_cost: pointsCost,
          family_id: profile.family_id,
          created_by: user.id,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating reward:', error);
        showAlert('Failed to create reward: ' + error.message, "error");
        return;
      }

      if (newReward) {
        setRewards([newReward, ...rewards]);
        setNewRewardTitle('');
        setNewRewardDescription('');
        setNewRewardPoints('50');
        showAlert('Reward created successfully!', "success");
      }
    } catch (error) {
      console.error('Error in handleCreateReward:', error);
      showAlert('Failed to create reward', "error");
    }
  };

  const loadSuggestions = async () => {
    console.log('🔍 loadSuggestions called on Rewards Store page');
    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user logged in, skipping suggestions load');
        return;
      }
      console.log('Loading suggestions for user:', user.id);

      // First, check ALL notifications for this user to debug
      const { data: allNotifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .limit(10);
      
      console.log('📋 ALL notifications for user:', allNotifs?.length || 0, allNotifs);
      
      // Filter to show only relevant fields
      if (allNotifs && allNotifs.length > 0) {
        console.log('📋 Notification details:', allNotifs.map(n => ({
          id: n.id,
          action_url: n.action_url,
          read: n.read,
          title: n.title,
          created_at: n.created_at
        })));
      }

      // Load reward suggestion notifications for this parent
      // Don't filter by read status - suggestions should stay until approved/rejected
      const { data: notificationsData, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('action_url', '/rewards-store')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading suggestions:', error);
        return;
      }

      console.log('✅ Found suggestions:', notificationsData?.length || 0);
      if (notificationsData) {
        console.log('Loaded suggestions:', notificationsData.length, notificationsData);
        setSuggestions(notificationsData as RewardSuggestion[]);
      } else {
        console.log('No suggestions found');
      }
    } catch (error) {
      // Ignore AbortError - normal when navigating away
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Error in loadSuggestions:', error);
    }
  };

  const handleApproveSuggestion = async (suggestion: RewardSuggestion) => {
    // Check if user has premium subscription
    if (!isPremium) {
      showAlert('Premium subscription required to approve reward suggestions.\n\nUpgrade to premium to approve suggestions from your children!', "warning");
      // Optionally redirect to upgrade page after a delay
      setTimeout(() => {
        router.push('/settings?tab=subscription');
      }, 3000);
      return;
    }

    const confirmed = await showConfirm(`Create reward "${suggestion.metadata.reward_name}" for ${suggestion.metadata.suggested_points} points?`);
    if (!confirmed) return;

    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showAlert('You must be logged in', "error");
        return;
      }

      // Get user's family_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user.id)
        .single();

      if (!profile?.family_id) {
        showAlert('Family ID not found', "error");
        return;
      }

      // Create the reward
      const { data: newReward, error: rewardError } = await supabase
        .from('rewards')
        .insert({
          title: suggestion.metadata.reward_name,
          description: suggestion.metadata.reward_description || null,
          points_cost: suggestion.metadata.suggested_points,
          family_id: profile.family_id,
          created_by: user.id,
          is_active: true
        })
        .select()
        .single();

      if (rewardError) {
        console.error('Error creating reward:', rewardError);
        showAlert('Failed to create reward: ' + rewardError.message, "error");
        return;
      }

      // Delete the notification since the suggestion has been handled
      const { error: notifError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', suggestion.id);

      if (notifError) {
        console.error('Error deleting notification:', notifError);
      }

      // Notify the child that their suggestion was approved
      await supabase
        .from('notifications')
        .insert({
          user_id: suggestion.metadata.suggested_by,
          family_id: profile.family_id,
          type: 'success',
          title: 'Reward Suggestion Approved! 🎉',
          message: `Your reward suggestion "${suggestion.metadata.reward_name}" has been added to the store!`,
          action_url: '/my-rewards',
          action_text: 'View Rewards',
          read: false
        });

      // Update UI
      setRewards([newReward!, ...rewards]);
      setSuggestions(suggestions.filter(s => s.id !== suggestion.id));
      showAlert(`Reward "${suggestion.metadata.reward_name}" created successfully!`, "success");
    } catch (error) {
      console.error('Error in handleApproveSuggestion:', error);
      showAlert('Failed to approve suggestion', "error");
    }
  };

  const handleRejectSuggestion = async (suggestion: RewardSuggestion) => {
    // Check if user has premium subscription
    if (!isPremium) {
      showAlert('Premium subscription required to respond to reward suggestions.\n\nUpgrade to premium to approve or reject suggestions from your children!', "warning");
      // Optionally redirect to upgrade page after a delay
      setTimeout(() => {
        router.push('/settings?tab=subscription');
      }, 3000);
      return;
    }

    const confirmed = await showConfirm(`Reject suggestion "${suggestion.metadata.reward_name}"?`);
    if (!confirmed) return;

    try {
      const supabase = createClientSupabaseClient();

      // Delete the notification since the suggestion has been rejected
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', suggestion.id);

      if (error) {
        console.error('Error deleting notification:', error);
        showAlert('Failed to reject suggestion', "error");
        return;
      }

      // Optionally notify child of rejection
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', suggestion.metadata.suggested_by)
        .single();

      if (profile) {
        await supabase
          .from('notifications')
          .insert({
            user_id: suggestion.metadata.suggested_by,
            family_id: profile.family_id,
            type: 'info',
            title: 'Reward Suggestion Not Added',
            message: `Your suggestion "${suggestion.metadata.reward_name}" was reviewed. Try suggesting something else!`,
            action_url: '/my-rewards',
            action_text: 'View Rewards',
            read: false
          });
      }

      // Update UI
      setSuggestions(suggestions.filter(s => s.id !== suggestion.id));
      showAlert('Suggestion rejected', "info");
    } catch (error) {
      console.error('Error in handleRejectSuggestion:', error);
      showAlert('Failed to reject suggestion', "error");
    }
  };

  const loadRedemptions = async () => {
    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get user's family_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user.id)
        .single();

      if (!profile?.family_id) return;

      // Load pending reward redemptions for this family (without user join first)
      const { data: redemptionsData, error } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          reward:rewards!reward_id(*)
        `)
        .eq('status', 'pending')
        .order('redeemed_at', { ascending: false });

      if (error) {
        console.error('Error loading redemptions:', error);
        return;
      }

      if (redemptionsData) {
        // Get user profiles for each redemption
        const userIds = redemptionsData.map(r => r.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        // Map profiles to redemptions
        const redemptionsWithUsers = redemptionsData.map(r => ({
          ...r,
          user: profilesData?.find(p => p.id === r.user_id)
        }));

        // Filter to only show redemptions for rewards in this family
        const familyRedemptions = redemptionsWithUsers.filter(r => 
          r.reward && r.reward.family_id === profile.family_id
        );
        
        console.log('Loaded redemptions:', familyRedemptions.length, familyRedemptions);
        setRedemptions(familyRedemptions);
      }
    } catch (error) {
      // Ignore AbortError - normal when navigating away
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Error in loadRedemptions:', error);
    }
  };

  const handleApproveRedemption = async (redemptionId: string) => {
    const confirmed = await showConfirm('Approve this reward request?');
    if (!confirmed) return;

    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showAlert('You must be logged in', "error");
        return;
      }

      // Update redemption status
      const { error } = await supabase
        .from('reward_redemptions')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('id', redemptionId);

      if (error) {
        console.error('Error approving redemption:', error);
        showAlert('Failed to approve reward request', "error");
        return;
      }

      // Update UI
      setRedemptions(redemptions.filter(r => r.id !== redemptionId));
      showAlert('Reward request approved!', "success");
    } catch (error) {
      console.error('Error in handleApproveRedemption:', error);
      showAlert('Failed to approve reward request', "error");
    }
  };

  const handleRejectRedemption = async (redemptionId: string) => {
    const confirmed = await showConfirm('Reject this reward request? Points will be returned to the child.');
    if (!confirmed) return;

    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showAlert('You must be logged in', "error");
        return;
      }

      // Get redemption details to return points
      const redemption = redemptions.find(r => r.id === redemptionId);
      if (!redemption) return;

      // Update redemption status
      const { error: redemptionError } = await supabase
        .from('reward_redemptions')
        .update({
          status: 'rejected',
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('id', redemptionId);

      if (redemptionError) {
        console.error('Error rejecting redemption:', redemptionError);
        showAlert('Failed to reject reward request', "error");
        return;
      }

      // Return points to child (points are managed by triggers on reward_redemptions)
      // The trigger will automatically handle point restoration

      // Update UI
      setRedemptions(redemptions.filter(r => r.id !== redemptionId));
      showAlert('Reward request rejected. Points returned to child.', "info");
    } catch (error) {
      console.error('Error in handleRejectRedemption:', error);
      showAlert('Failed to reject reward request', "error");
    }
  };

  const handleDeleteReward = async (rewardId: string) => {
    const confirmed = await showConfirm('Are you sure you want to delete this reward?');
    if (!confirmed) return;

    try {
      const supabase = createClientSupabaseClient();
      
      // Instead of deleting, mark as inactive
      const { error } = await supabase
        .from('rewards')
        .update({ is_active: false })
        .eq('id', rewardId);

      if (error) {
        console.error('Error deleting reward:', error);
        showAlert('Failed to delete reward', "error");
        return;
      }

      setRewards(rewards.filter(r => r.id !== rewardId));
      showAlert('Reward deleted successfully', "success");
    } catch (error) {
      console.error('Error in handleDeleteReward:', error);
      showAlert('Failed to delete reward', "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER - Teal/Cyan gradient */}
      <header className="bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/parent-dashboard" className="flex items-center gap-2 hover:opacity-80">
                <i className="fas fa-arrow-left"></i>
                <span>Back to Dashboard</span>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Rewards Store Manager</h1>
                <p className="text-white/80 mt-1">Parents: Manage rewards and approve requests</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl">
                <i className="fas fa-user-shield text-xl"></i>
                <div>
                  <div className="font-bold">Parent Account</div>
                  <div className="text-sm text-white/80">Full Access</div>
                </div>
              </div>
              <Link 
                href="/parent-profile"
                className="flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full transition-all overflow-hidden"
                title="My Profile"
              >
                {profileImage ? (
                  <img src={profileImage} alt="Parent Profile" className="w-full h-full object-cover" />
                ) : (
                  <i className="fas fa-user text-lg"></i>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Reward Suggestions from Children */}
        {suggestions.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 border-2 border-purple-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-purple-800 flex items-center gap-3">
                <i className="fas fa-lightbulb"></i>
                Child Reward Suggestions
                <span className="text-sm bg-purple-200 text-purple-800 px-3 py-1 rounded-full font-semibold">
                  {suggestions.length} new
                </span>
              </h2>
            </div>

            {/* Premium Upgrade Notice for Non-Premium Users */}
            {!isPremium && (
              <div className="mb-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-4 shadow-lg flex items-start gap-4">
                <div className="flex-shrink-0">
                  <i className="fas fa-crown text-3xl text-yellow-200"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">Premium Feature</h3>
                  <p className="text-sm text-white/90">
                    Your children can suggest rewards anytime, but responding to suggestions requires a Premium subscription.
                    Upgrade now to approve or reject their creative ideas and manage your family's rewards!
                  </p>
                  <button
                    onClick={() => router.push('/settings?tab=subscription')}
                    className="mt-3 px-4 py-2 bg-white text-orange-600 rounded-lg font-semibold hover:bg-gray-100 transition"
                  >
                    <i className="fas fa-star mr-2"></i>
                    Upgrade to Premium
                  </button>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="bg-white rounded-xl p-6 border border-purple-200 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 text-lg mb-1">
                        {suggestion.metadata.reward_name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {suggestion.metadata.reward_description}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <i className="fas fa-user-circle"></i>
                        <span>Suggested by {suggestion.metadata.suggested_by_name}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-purple-600">
                        {suggestion.metadata.suggested_points}
                      </div>
                      <div className="text-sm text-gray-500">points</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-purple-100">
                    <button
                      onClick={() => handleApproveSuggestion(suggestion)}
                      className={`flex-1 px-4 py-2 ${
                        isPremium
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg'
                      } text-white rounded-lg transition font-semibold relative group`}
                      title={isPremium ? 'Approve suggestion' : 'Premium feature - Click to upgrade'}
                    >
                      {!isPremium && (
                        <i className="fas fa-crown mr-2 text-yellow-200"></i>
                      )}
                      <i className="fas fa-check mr-2"></i> Approve & Add
                      {!isPremium && (
                        <span className="absolute -top-2 -right-2 bg-yellow-400 text-xs text-gray-900 px-2 py-1 rounded-full font-bold shadow-lg">
                          Premium
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => handleRejectSuggestion(suggestion)}
                      className={`px-4 py-2 ${
                        isPremium
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg'
                      } rounded-lg transition font-semibold relative group`}
                      title={isPremium ? 'Reject suggestion' : 'Premium feature - Click to upgrade'}
                    >
                      {!isPremium && (
                        <i className="fas fa-crown mr-2 text-yellow-200"></i>
                      )}
                      <i className="fas fa-times mr-2"></i> Reject
                      {!isPremium && (
                        <span className="absolute -top-2 -right-2 bg-yellow-400 text-xs text-gray-900 px-2 py-1 rounded-full font-bold shadow-lg">
                          Premium
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Requested Rewards from Children */}
        {redemptions.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-blue-800 flex items-center gap-3">
                <i className="fas fa-gift"></i>
                Pending Reward Requests
                <span className="text-sm bg-blue-200 text-blue-800 px-3 py-1 rounded-full font-semibold">
                  {redemptions.length} pending
                </span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {redemptions.map((redemption) => (
                <div key={redemption.id} className="bg-white rounded-xl p-6 border border-blue-200 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 text-lg mb-1">
                        {redemption.reward?.title || 'Unknown Reward'}
                      </h3>
                      {redemption.reward?.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {redemption.reward.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <i className="fas fa-user-circle"></i>
                        <span>Requested by {redemption.user?.full_name || 'Child'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                        <i className="fas fa-clock"></i>
                        <span>{new Date(redemption.redeemed_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {redemption.points_spent}
                      </div>
                      <div className="text-sm text-gray-500">points</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-blue-100">
                    <button
                      onClick={() => handleApproveRedemption(redemption.id)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition font-semibold"
                    >
                      <i className="fas fa-check mr-2"></i> Approve
                    </button>
                    <button
                      onClick={() => handleRejectRedemption(redemption.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold"
                    >
                      <i className="fas fa-times mr-2"></i> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rewards Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add New Reward Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#006372] flex items-center gap-3">
                  <i className="fas fa-plus-circle"></i>
                  Add New Reward {!isPremium && <span className="text-purple-600 text-sm ml-2">👑 Premium</span>}
                </h2>
                <div className="text-sm text-gray-500">
                  {rewards.length} rewards in store
                </div>
              </div>

              <PremiumGuard
                fallback={
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-8 text-center">
                    <div className="text-6xl mb-4">👑</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Custom Rewards - Premium Feature</h3>
                    <p className="text-gray-600 mb-6">
                      Create unlimited custom rewards for your family! Free tier includes basic pre-set rewards.
                    </p>
                    <button
                      onClick={() => router.push('/pricing')}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition"
                    >
                      Upgrade to Premium
                    </button>
                  </div>
                }
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Reward Name *</label>
                      <input
                        type="text"
                        value={newRewardTitle}
                        onChange={(e) => setNewRewardTitle(e.target.value)}
                        className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
                        placeholder="e.g., Special Pizza Night"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Point Cost *</label>
                      <input
                        type="number"
                        value={newRewardPoints}
                        onChange={(e) => setNewRewardPoints(e.target.value)}
                        className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
                        placeholder="Enter points required"
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea
                      value={newRewardDescription}
                      onChange={(e) => setNewRewardDescription(e.target.value)}
                      className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
                      rows={3}
                      placeholder="Describe what the child earns with this reward..."
                    />
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      onClick={handleCreateReward}
                      disabled={!newRewardTitle.trim() || !newRewardDescription.trim() || parseInt(newRewardPoints) <= 0}
                      className={`px-8 py-3.5 rounded-xl font-bold transition ${
                        newRewardTitle.trim() && newRewardDescription.trim() && parseInt(newRewardPoints) > 0
                          ? "bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white hover:opacity-90 hover:shadow-lg"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <i className="fas fa-plus mr-2"></i> Add to Store
                    </button>
                  </div>
                </div>
              </PremiumGuard>
            </div>

            {/* Rewards List */}
            <div className="mt-8 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-[#006372] mb-6">Current Rewards in Store</h2>
              
              {rewards.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <i className="fas fa-gift text-4xl mb-4 text-gray-400"></i>
                  <p className="text-lg">No rewards added yet. Create your first reward above!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {rewards.map((reward) => (
                    <div key={reward.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition bg-gradient-to-br from-cyan-50 to-teal-50">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-[#006372] text-lg">{reward.title}</h3>
                            {reward.is_default && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                ✓ Default
                              </span>
                            )}
                          </div>
                          {reward.description && (
                            <p className="text-gray-600 text-sm mt-1">{reward.description}</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-[#00C2E0]">{reward.points_cost}</div>
                          <div className="text-sm text-gray-500">points</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end mt-4 pt-4 border-t border-gray-200">
                        {!reward.is_default && (
                          <button
                            onClick={() => handleDeleteReward(reward.id)}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                          >
                            <i className="fas fa-trash mr-2"></i> Remove
                          </button>
                        )}
                        {reward.is_default && (
                          <div className="text-sm text-gray-500 italic">
                            <i className="fas fa-lock mr-1"></i> Default reward (cannot be removed)
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Stats & Info */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 sticky top-6">
              <h3 className="text-xl font-bold text-[#006372] mb-6 flex items-center gap-2">
                <i className="fas fa-chart-bar"></i>
                Store Statistics
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-[#00C2E0]/30">
                  <div className="text-sm text-gray-600">Total Rewards</div>
                  <div className="text-3xl font-bold text-[#006372] mt-2">{rewards.length}</div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-[#00C2E0]/30">
                  <div className="text-sm text-gray-600">Average Point Cost</div>
                  <div className="text-3xl font-bold text-[#006372] mt-2">
                    {rewards.length > 0 ? Math.round(rewards.reduce((sum, r) => sum + r.points_cost, 0) / rewards.length) : 0}
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-[#00C2E0]/30">
                  <div className="text-sm text-gray-600">Lowest Cost Reward</div>
                  <div className="text-3xl font-bold text-[#006372] mt-2">
                    {rewards.length > 0 ? Math.min(...rewards.map(r => r.points_cost)) : 0}
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-[#00C2E0]/30">
                  <div className="text-sm text-gray-600">Highest Cost Reward</div>
                  <div className="text-3xl font-bold text-[#006372] mt-2">
                    {rewards.length > 0 ? Math.max(...rewards.map(r => r.points_cost)) : 0}
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-[#00C2E0]/30">
                <h4 className="font-bold text-[#006372] mb-3 flex items-center gap-2">
                  <i className="fas fa-lightbulb"></i>
                  Tips for Parents
                </h4>
                <ul className="text-sm text-[#006372]/80 space-y-2">
                  <li className="flex items-start gap-2">
                    <i className="fas fa-check text-[#00C2E0] mt-0.5"></i>
                    Balance point costs with task difficulty
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="fas fa-check text-[#00C2E0] mt-0.5"></i>
                    Keep 8-12 rewards available at all times
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="fas fa-check text-[#00C2E0] mt-0.5"></i>
                    Review requests within 24 hours
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="fas fa-check text-[#00C2E0] mt-0.5"></i>
                    Add seasonal rewards for variety
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

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
                className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white hover:opacity-90 transition"
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


