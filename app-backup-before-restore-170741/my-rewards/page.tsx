"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { rewardsApi, profileApi } from "@/app/lib/supabase";

export default function MyRewardsPage() {
  const [rewards, setRewards] = useState([]);
  const [claimedRewards, setClaimedRewards] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        
        // Load available rewards
        const rewardsData = await rewardsApi.getRewards();
        setRewards(rewardsData);
        
        // Load claimed rewards
        const claimedData = await rewardsApi.getClaimedRewards();
        setClaimedRewards(claimedData);
        
        // Calculate total points (this would come from your tasks completion)
        // For now, using a placeholder - you'll need to calculate this from completed tasks
        setTotalPoints(1250); // Replace with actual calculation
        
      } catch (error) {
        console.error("Error loading rewards:", error);
        alert("Failed to load rewards. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  const handleClaimReward = async (rewardId, rewardName) => {
    if (!confirm(`Claim "${rewardName}"?`)) return;
    
    try {
      await rewardsApi.claimReward(rewardId);
      alert("Reward claimed! Waiting for parent approval.");
      
      // Refresh claimed rewards
      const claimedData = await rewardsApi.getClaimedRewards();
      setClaimedRewards(claimedData);
    } catch (error) {
      console.error("Error claiming reward:", error);
      alert("Failed to claim reward. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
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
        {/* POINTS DISPLAY */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 text-center border border-[#00C2E0]/20">
          <div className="inline-block bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white py-3 px-8 rounded-full shadow-lg">
            <i className="fas fa-star mr-2"></i>
            <span className="text-3xl font-bold">{totalPoints.toLocaleString()}</span>
            <span className="ml-2">Points Available</span>
          </div>
          <p className="text-gray-600 mt-4">Complete more tasks to earn points for rewards!</p>
        </div>

        {/* AVAILABLE REWARDS */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mb-8">
          <h2 className="text-2xl font-bold text-[#006372] mb-6">Available Rewards</h2>
          
          {rewards.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No rewards available yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Ask your parents to add rewards you can redeem
              </p>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6">Redeem your points for these rewards:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rewards.map((reward) => (
                  <div key={reward.id} className="border border-[#00C2E0]/30 rounded-xl p-6 hover:shadow-md transition bg-gradient-to-br from-cyan-50 to-teal-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-[#006372]">{reward.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{reward.description}</p>
                      </div>
                      <div className="bg-gradient-to-r from-[#00C2E0]/20 to-[#006372]/20 text-[#006372] py-1 px-4 rounded-full font-bold border border-[#00C2E0]/30">
                        {reward.points_required} pts
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm">
                        {totalPoints >= reward.points_required ? (
                          <span className="text-green-600">
                            <i className="fas fa-check-circle mr-1"></i> You have enough points!
                          </span>
                        ) : (
                          <span className="text-red-600">
                            Need {reward.points_required - totalPoints} more points
                          </span>
                        )}
                      </div>
                      <button 
                        className={`px-6 py-2 rounded-lg font-bold transition ${
                          totalPoints >= reward.points_required
                            ? "bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white hover:opacity-90 hover:shadow-md"
                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        }`}
                        disabled={totalPoints < reward.points_required}
                        onClick={() => handleClaimReward(reward.id, reward.title)}
                      >
                        {totalPoints >= reward.points_required ? "Claim Reward" : "Need More Points"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* CLAIMED REWARDS */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-[#006372] mb-6">My Claimed Rewards</h2>
          
          {claimedRewards.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No rewards claimed yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Claim your first reward from the list above
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {claimedRewards.map((claimed) => (
                <div key={claimed.id} className="border border-gray-200 rounded-xl p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{claimed.rewards?.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{claimed.rewards?.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          claimed.status === 'approved' ? 'bg-green-100 text-green-800' :
                          claimed.status === 'denied' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {claimed.status.charAt(0).toUpperCase() + claimed.status.slice(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          Claimed: {new Date(claimed.claimed_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-sm font-bold">
                      {claimed.rewards?.points_required} points
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
