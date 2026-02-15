"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from '@/lib/supabaseClient';

interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
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
}

export default function MyRewardsPage() {
  const [userRole, setUserRole] = useState("child");
  const [profileImage, setProfileImage] = useState("");
  const [childAvatar, setChildAvatar] = useState("child");
  const router = useRouter();
  
  // CHILD-ONLY REWARDS VIEW - NO DUPLICATE VARIABLES
  useEffect(() => {
    const loadLocalProfile = async () => {
      const role = sessionStorage.getItem("userRole") || "child";
      setUserRole(role);

      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      const imageKey = user ? `childProfileImage:${user.id}` : "childProfileImage";
      const avatarKey = user ? `childAvatar:${user.id}` : "childAvatar";

      const savedProfileImage = localStorage.getItem(imageKey) || "";
      const savedAvatar = localStorage.getItem(avatarKey) || "child";
      setProfileImage(savedProfileImage);
      setChildAvatar(savedAvatar);
    };

    loadLocalProfile();
  }, [router]);

  const [availableRewards, setAvailableRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);

  const [myPoints, setMyPoints] = useState(0);

  // Modal states
  const [alertModal, setAlertModal] = useState<{ show: boolean; message: string; type: "success" | "error" | "warning" | "info" }>({ show: false, message: "", type: "info" });
  const [promptModal, setPromptModal] = useState<{ show: boolean; title: string; fields: { label: string; value: string; type: string }[]; onSubmit: (values: string[]) => void }>({ show: false, title: "", fields: [], onSubmit: () => {} });

  // Modal helper function
  const showAlert = (message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    setAlertModal({ show: true, message, type });
  };

  const showPrompt = (title: string, fields: { label: string; value: string; type: string }[]): Promise<string[]> => {
    return new Promise((resolve) => {
      setPromptModal({
        show: true,
        title,
        fields,
        onSubmit: (values: string[]) => {
          setPromptModal({ show: false, title: "", fields: [], onSubmit: () => {} });
          resolve(values);
        }
      });
    });
  };


  // --- Data Fetching from Supabase ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClientSupabaseClient();
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('No user found');
          return;
        }

        // Calculate points from approved tasks minus redemptions
        const { data: allTasks } = await supabase
          .from('tasks')
          .select('points, approved')
          .eq('assigned_to', user.id);

        const earnedPoints = allTasks?.reduce((total: number, task: any) => {
          if (task.approved) {
            return total + (task.points || 0);
          }
          return total;
        }, 0) || 0;

        const { data: allRedemptions } = await supabase
          .from('reward_redemptions')
          .select('points_spent')
          .eq('user_id', user.id)
          .eq('status', 'approved');

        const spentPoints = allRedemptions?.reduce((total: number, redemption: any) => {
          return total + (redemption.points_spent || 0);
        }, 0) || 0;

        const currentPoints = earnedPoints - spentPoints;
        setMyPoints(currentPoints);
        console.log('Loaded user points:', currentPoints, '(earned:', earnedPoints, 'spent:', spentPoints, ')');

        // Fetch user's family to get available rewards
        const { data: profile } = await supabase
          .from('profiles')
          .select('family_id')
          .eq('id', user.id)
          .single();

        if (profile?.family_id) {
          // Fetch available rewards for the family
          const { data: familyRewards, error: rewardsError } = await supabase
            .from('rewards')
            .select('*')
            .eq('family_id', profile.family_id)
            .eq('is_active', true)
            .order('points_cost', { ascending: true });

          if (rewardsError) {
            console.error('Error fetching rewards:', rewardsError);
          } else if (familyRewards) {
            setAvailableRewards(familyRewards.map(r => ({
              name: r.title,
              description: r.description || '',
              cost: r.points_cost,
              id: r.id
            })));
            console.log('Loaded rewards:', familyRewards.length);
          }

          // Fetch child's reward redemptions
          const { data: userRedemptions, error: redemptionsError } = await supabase
            .from('reward_redemptions')
            .select(`
              *,
              reward:rewards(*)
            `)
            .eq('user_id', user.id)
            .order('redeemed_at', { ascending: false });

          if (redemptionsError) {
            console.error('Error fetching redemptions:', redemptionsError);
          } else if (userRedemptions) {
            console.log('Loaded redemptions:', userRedemptions.length);
            setRedemptions(userRedemptions);
          }
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
      }
    };
    fetchData();

    // Set up real-time subscription for reward redemptions
    const supabase = createClientSupabaseClient();
    const channel = supabase
      .channel('my-rewards-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reward_redemptions' },
        async (payload) => {
          console.log('Redemption updated:', payload);
          
          // Refresh redemptions when status changes
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: userRedemptions } = await supabase
              .from('reward_redemptions')
              .select(`
                *,
                reward:rewards(*)
              `)
              .eq('user_id', user.id)
              .order('redeemed_at', { ascending: false });

            if (userRedemptions) {
              setRedemptions(userRedemptions);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency array means this runs once on component mount
  // --- End of Data Fetching ---

  // Function to send reminder to parent about pending reward
  const sendRewardReminder = async (redemptionId: string) => {
    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showAlert('You must be logged in to send reminders', "error");
        return;
      }

      // Get the current user's profile and family_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id, full_name')
        .eq('id', user.id)
        .single();

      if (!profile?.family_id) {
        showAlert('Could not find your family', "error");
        return;
      }

      // Get the redemption details
      const redemption = redemptions.find(r => r.id === redemptionId);
      if (!redemption || !redemption.reward) {
        showAlert('Could not find reward details', "error");
        return;
      }

      // Find the parent to notify
      const { data: parentProfile, error: parentError } = await supabase
        .from('profiles')
        .select('id, role, full_name')
        .eq('family_id', profile.family_id)
        .eq('role', 'parent')
        .maybeSingle();

      console.log('My-rewards - parent lookup:', { parentProfile, parentError, familyId: profile.family_id });

      if (!parentProfile) {
        showAlert(
          "No parent found in your family. Ask your parent to:\n1. Log in to the app\n2. Make sure they're in the same family",
          "warning"
        );
        return;
      }

      // Create notification for parent
      const { error: notificationError, data: notificationData } = await supabase
        .from('notifications')
        .insert({
          user_id: parentProfile.id,
          family_id: profile.family_id,
          type: 'reward',
          title: '⏰ Reward Approval Reminder',
          message: `${profile.full_name} is waiting for approval on: "${redemption.reward.title}" (${redemption.points_spent} points)`,
          read: false,
          action_url: '/rewards-store',
          action_text: 'Review Reward'
        })
        .select();

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        showAlert('Failed to send reminder', "error");
        return;
      }

      console.log('✅ Reminder notification created:', notificationData);
      showAlert('Reminder sent to parent! 📬', "success");
    } catch (error) {
      console.error('Error in sendRewardReminder:', error);
      showAlert('Failed to send reminder', "error");
    }
  };

  // Function to redeem a reward
  const redeemReward = async (rewardId: string, rewardName: string, rewardCost: number) => {
    if (myPoints < rewardCost) {
      showAlert(`You need ${rewardCost} points to redeem this reward!`, "warning");
      return;
    }

    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showAlert('You must be logged in to redeem rewards', "error");
        return;
      }

      // Create redemption request
      const { error } = await supabase
        .from('reward_redemptions')
        .insert({
          reward_id: rewardId,
          user_id: user.id,
          points_spent: rewardCost,
          status: 'pending'
        });

      if (error) {
        console.error('Error creating redemption:', error);
        showAlert('Failed to redeem reward: ' + error.message, "error");
        return;
      }

      showAlert(`Request sent to parents for: ${rewardName}\nParents will review and approve.`, "success");
      
      // Refresh redemptions list
      const { data: userRedemptions } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          reward:rewards(*)
        `)
        .eq('user_id', user.id)
        .order('redeemed_at', { ascending: false });

      if (userRedemptions) {
        setRedemptions(userRedemptions);
      }
      
      // Stay on my-rewards page so child can continue browsing/requesting rewards
    } catch (error) {
      console.error('Error in redeemReward:', error);
      showAlert('Failed to redeem reward', "error");
    }
  };

  // Function to suggest a new reward to parents
  const handleSuggestReward = async () => {
    const values = await showPrompt("Suggest a Reward", [
      { label: "Reward Name", value: "", type: "text" },
      { label: "Description", value: "", type: "text" },
      { label: "Points Cost (suggestion)", value: "", type: "number" }
    ]);

    if (!values || !values[0] || !values[1]) {
      return; // User cancelled or didn't fill required fields
    }

    const [name, description, points] = values;

    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showAlert('You must be logged in to suggest rewards', "error");
        return;
      }

      // Get user's profile for family_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id, full_name')
        .eq('id', user.id)
        .single();

      if (!profile?.family_id) {
        showAlert('Could not find your family information', "error");
        return;
      }

      // Find the parent in the family to send notification
      const { data: parentProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('family_id', profile.family_id)
        .eq('role', 'parent')
        .single();

      if (!parentProfile) {
        showAlert('Could not find a parent to send suggestion to', "error");
        return;
      }

      // Create a notification for the PARENT (not the child)
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: parentProfile.id,  // ✅ Send to parent, not child
          family_id: profile.family_id,
          type: 'info',
          title: 'New Reward Suggestion 💡',
          message: `${profile.full_name || 'Your child'} suggested a new reward: "${name}" - ${description} (${points || '?'} points)`,
          action_url: '/rewards-store',
          action_text: 'View Suggestions',
          read: false,
          metadata: {
            suggestion_type: 'reward',
            reward_name: name,
            reward_description: description,
            suggested_points: points || null,
            suggested_by: user.id,
            suggested_by_name: profile.full_name
          }
        });

      if (error) {
        console.error('Error creating suggestion:', error);
        showAlert('Failed to send suggestion: ' + error.message, "error");
        return;
      }

      showAlert(`Reward suggestion sent to parents!\n\n"${name}"\nYour parents will review your suggestion.`, "success");
    } catch (error) {
      console.error('Error in handleSuggestReward:', error);
      showAlert('Failed to send suggestion', "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER - Changed from purple/pink to teal/cyan */}
      <div className="bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/child-dashboard" className="flex items-center gap-2 hover:opacity-80 hover:text-white/90">
            <i className="fas fa-arrow-left"></i>
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold">My Rewards</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSuggestReward}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all font-medium"
              title="Suggest a new reward"
            >
              <i className="fas fa-lightbulb"></i>
              <span className="hidden md:inline">Suggest Reward</span>
            </button>
            <Link
              href="/child-profile"
              className="flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full transition-all overflow-hidden"
              title="My Profile"
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl">
                  {childAvatar === "child" ? "👦" :
                   childAvatar === "girl" ? "👧" :
                   childAvatar === "robot" ? "🤖" :
                   childAvatar === "superhero" ? "🦸" :
                   childAvatar === "astronaut" ? "🧑‍🚀" :
                   childAvatar === "alien" ? "👽" :
                   childAvatar === "ninja" ? "🥷" :
                   childAvatar === "wizard" ? "🧙" :
                   "👦"}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* POINTS DISPLAY - Changed from yellow/orange to teal/cyan */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 text-center border border-[#00C2E0]/20">
          <div className="inline-block bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white py-3 px-8 rounded-full shadow-lg">
            <i className="fas fa-star mr-2"></i>
            <span className="text-3xl font-bold">{myPoints.toLocaleString()}</span>
            <span className="ml-2">Points Available</span>
          </div>
          <p className="text-gray-600 mt-4">Ask your parents to add more rewards you can earn!</p>
        </div>

        {/* AVAILABLE REWARDS */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mb-8">
          <h2 className="text-2xl font-bold text-[#006372] mb-6">Pending Requests</h2>
          
          {redemptions.filter(r => r.status === 'pending').length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-clock text-4xl text-gray-300 mb-3"></i>
              <p>No pending requests</p>
              <p className="text-sm">Request a reward below and it will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {redemptions.filter(r => r.status === 'pending').map((redemption) => (
                <div key={redemption.id} className="border border-amber-200 bg-amber-50 rounded-xl p-6">
                  <div className="text-center">
                    <i className="fas fa-clock text-3xl text-amber-600 mb-3"></i>
                    <div className="font-bold text-amber-700 text-lg mb-2">Pending Approval</div>
                    <div className="text-gray-700 font-medium mb-1">{redemption.reward?.title || 'Unknown Reward'}</div>
                    <div className="text-sm text-amber-600 mb-2">{redemption.points_spent} points</div>
                    <div className="text-xs text-gray-500">
                      Requested {new Date(redemption.redeemed_at).toLocaleDateString()}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Waiting for parent approval...</p>
                    <button
                      onClick={() => sendRewardReminder(redemption.id)}
                      className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 w-full"
                    >
                      <i className="fas fa-bell"></i> Send Reminder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* APPROVED REWARDS */}
        {redemptions.filter(r => r.status === 'approved').length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-green-600 mb-6">Approved Rewards</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {redemptions.filter(r => r.status === 'approved').map((redemption) => (
                <div key={redemption.id} className="border border-green-200 bg-green-50 rounded-xl p-6">
                  <div className="text-center">
                    <i className="fas fa-check-circle text-3xl text-green-600 mb-3"></i>
                    <div className="font-bold text-green-700 text-lg mb-2">Approved!</div>
                    <div className="text-gray-700 font-medium mb-1">{redemption.reward?.title || 'Unknown Reward'}</div>
                    <div className="text-sm text-green-600 mb-2">{redemption.points_spent} points</div>
                    {redemption.approved_at && (
                      <div className="text-xs text-gray-500">
                        Approved {new Date(redemption.approved_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AVAILABLE REWARDS */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-[#006372] mb-6">Available Rewards</h2>
          <p className="text-gray-600 mb-6">Redeem your points for these rewards:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableRewards.map((reward, index) => {
              const redemption = redemptions.find(
                r => r.reward_id === reward.id && (r.status === 'pending' || r.status === 'approved')
              );
              const isRedeemed = redemption?.status === 'approved';
              const isPending = redemption?.status === 'pending';
              
              return (
              <div key={index} className={`border rounded-xl p-6 hover:shadow-md transition ${
                isRedeemed
                  ? 'bg-green-50 border-green-200'
                  : isPending
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-gradient-to-br from-cyan-50 to-teal-50 border-[#00C2E0]/30'
              }`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-[#006372]">{reward.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{reward.description}</p>
                  </div>
                  {/* Changed from purple/pink to teal/cyan */}
                  <div className="bg-gradient-to-r from-[#00C2E0]/20 to-[#006372]/20 text-[#006372] py-1 px-4 rounded-full font-bold border border-[#00C2E0]/30">
                    {reward.cost} pts
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm">
                    {isRedeemed ? (
                      <span className="text-green-600">
                        <i className="fas fa-check-circle mr-1"></i> Approved!
                      </span>
                    ) : isPending ? (
                      <span className="text-amber-600">
                        <i className="fas fa-clock mr-1"></i> Pending approval
                      </span>
                    ) : myPoints >= reward.cost ? (
                      <span className="text-green-600">
                        <i className="fas fa-check-circle mr-1"></i> You have enough points!
                      </span>
                    ) : (
                      <span className="text-red-600">
                        Need {reward.cost - myPoints} more points
                      </span>
                    )}
                  </div>
                  {/* Button changed to teal/cyan gradient */}
                  <button 
                    className={`px-6 py-2 rounded-lg font-bold transition ${
                      isRedeemed || isPending
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : myPoints >= reward.cost
                        ? "bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white hover:opacity-90 hover:shadow-md"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                    disabled={myPoints < reward.cost || isRedeemed || isPending}
                    onClick={() => {
                      if (myPoints >= reward.cost && !isRedeemed && !isPending) {
                        redeemReward(reward.id, reward.name, reward.cost);
                      }
                    }}
                  >
                    {isRedeemed ? "Approved" : isPending ? "Pending" : myPoints >= reward.cost ? "Request Reward" : "Need More Points"}
                  </button>
                </div>
              </div>
              );
            })}
          </div>
          
          {availableRewards.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <i className="fas fa-trophy text-4xl text-gray-300 mb-3"></i>
              <p>No rewards available yet</p>
              <p className="text-sm">Ask your parents to create some rewards!</p>
            </div>
          )}
          
          {/* INFO BOX - Changed to teal/cyan theme */}
          <div className="mt-8 p-4 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-[#00C2E0]/30">
            <div className="flex items-center gap-3">
              <i className="fas fa-info-circle text-[#00C2E0] text-xl"></i>
              <div>
                <h4 className="font-bold text-[#006372]">How Rewards Work</h4>
                <p className="text-[#006372]/80 text-sm">
                  1. Request a reward using your points<br/>
                  2. Parents will review and approve<br/>
                  3. Once approved, enjoy your reward!
                </p>
              </div>
            </div>
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
            <p className="text-gray-700 text-center mb-6 whitespace-pre-line">{alertModal.message}</p>
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

      {/* Prompt Modal for Reward Suggestion */}
      {promptModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scaleIn">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-lightbulb text-3xl text-blue-600"></i>
            </div>
            <h3 className="text-xl font-bold text-center mb-2 text-gray-800">{promptModal.title}</h3>
            <p className="text-gray-600 text-center mb-6 text-sm">Tell your parents what reward you'd like!</p>
            
            <div className="space-y-4 mb-6">
              {promptModal.fields.map((field, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {index < 2 && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={field.type}
                    defaultValue={field.value}
                    id={`prompt-field-${index}`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
                    placeholder={field.label}
                  />
                </div>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPromptModal({ show: false, title: "", fields: [], onSubmit: () => {} });
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const values = promptModal.fields.map((_, index) => {
                    const input = document.getElementById(`prompt-field-${index}`) as HTMLInputElement;
                    return input ? input.value : "";
                  });
                  promptModal.onSubmit(values);
                }}
                className="flex-1 bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white py-3 rounded-lg font-bold hover:opacity-90 transition-all"
              >
                Send Suggestion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


