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

export default function MyRewardsPage() {
  const [userRole, setUserRole] = useState("child");
  const router = useRouter();
  
  // CHILD-ONLY REWARDS VIEW - NO DUPLICATE VARIABLES
  useEffect(() => {
    const role = sessionStorage.getItem("userRole") || "child";
    setUserRole(role);
    
    // STRICT: Parents CANNOT access child rewards
    
  }, [router]);

  const [availableRewards, setAvailableRewards] = useState<Reward[]>([]);

  const [myPoints, setMyPoints] = useState(0);

  // Modal states
  const [alertModal, setAlertModal] = useState<{ show: boolean; message: string; type: "success" | "error" | "warning" | "info" }>({ show: false, message: "", type: "info" });

  // Modal helper function
  const showAlert = (message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    setAlertModal({ show: true, message, type });
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

        // Fetch user's points from user_profiles
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('total_points')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
        } else if (userProfile) {
          setMyPoints(userProfile.total_points || 0);
          console.log('Loaded user points:', userProfile.total_points);
        }

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
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
      }
    };
    fetchData();
  }, []); // Empty dependency array means this runs once on component mount
  // --- End of Data Fetching ---

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
      
      // Redirect back to child dashboard
      router.push('/child-dashboard');
    } catch (error) {
      console.error('Error in redeemReward:', error);
      showAlert('Failed to redeem reward', "error");
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
          <div className="w-24"></div>
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
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-[#006372] mb-6">Available Rewards</h2>
          <p className="text-gray-600 mb-6">Redeem your points for these rewards:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableRewards.map((reward, index) => (
              <div key={index} className="border border-[#00C2E0]/30 rounded-xl p-6 hover:shadow-md transition bg-gradient-to-br from-cyan-50 to-teal-50">
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
                    {myPoints >= reward.cost ? (
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
                      myPoints >= reward.cost
                        ? "bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white hover:opacity-90 hover:shadow-md"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                    disabled={myPoints < reward.cost}
                    onClick={() => {
                      if (myPoints >= reward.cost) {
                        redeemReward(reward.id, reward.name, reward.cost);
                      }
                    }}
                  >
                    {myPoints >= reward.cost ? "Request Reward" : "Need More Points"}
                  </button>
                </div>
              </div>
            ))}
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
              alertModal.type === \"success\" ? \"bg-green-100\" :
              alertModal.type === \"error\" ? \"bg-red-100\" :
              alertModal.type === \"warning\" ? \"bg-yellow-100\" :
              \"bg-blue-100\"
            }`}>
              <span className=\"text-3xl\">{
                alertModal.type === \"success\" ? \"✓\" :
                alertModal.type === \"error\" ? \"✕\" :
                alertModal.type === \"warning\" ? \"⚠\" :
                \"ℹ\"
              }</span>
            </div>
            <h3 className={`text-xl font-bold text-center mb-2 ${
              alertModal.type === \"success\" ? \"text-green-600\" :
              alertModal.type === \"error\" ? \"text-red-600\" :
              alertModal.type === \"warning\" ? \"text-yellow-600\" :
              \"text-blue-600\"
            }`}>
              {alertModal.type === \"success\" ? \"Success!\" :
               alertModal.type === \"error\" ? \"Error\" :
               alertModal.type === \"warning\" ? \"Warning\" :
               \"Information\"}
            </h3>
            <p className=\"text-gray-700 text-center mb-6 whitespace-pre-line\">{alertModal.message}</p>
            <button
              onClick={() => setAlertModal({ ...alertModal, show: false })}
              className={`w-full py-3 rounded-xl font-bold text-white transition ${
                alertModal.type === \"success\" ? \"bg-green-500 hover:bg-green-600\" :
                alertModal.type === \"error\" ? \"bg-red-500 hover:bg-red-600\" :
                alertModal.type === \"warning\" ? \"bg-yellow-500 hover:bg-yellow-600\" :
                \"bg-blue-500 hover:bg-blue-600\"
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


