"use client";

import { useState, useEffect } from "react";
import { rewardsApi } from "@/app/lib/supabase";

export default function RewardsStorePage() {
  const [rewards, setRewards] = useState([]);
  const [newReward, setNewReward] = useState({
    title: "",
    description: "",
    points_required: 100,
    is_active: true
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load rewards from Supabase
  useEffect(() => {
    async function loadRewards() {
      try {
        setIsLoading(true);
        const rewardsData = await rewardsApi.getRewards();
        setRewards(rewardsData);
      } catch (error) {
        console.error("Error loading rewards:", error);
        alert("Failed to load rewards. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    }
    
    loadRewards();
  }, []);

  const handleCreateReward = async () => {
    if (!newReward.title.trim()) {
      alert("Please enter a reward title");
      return;
    }

    try {
      // Note: The rewardsApi.createReward function needs to be added to your supabase.ts
      // For now, we'll use direct supabase call
      const { supabase } = require("@/app/lib/supabase");
      const familyId = await (await import("@/app/lib/supabase")).getFamilyId();
      
      const { data, error } = await supabase
        .from('rewards')
        .insert([{ ...newReward, family_id: familyId }])
        .select()
        .single();
      
      if (error) throw error;
      
      setRewards([data, ...rewards]);
      setNewReward({ title: "", description: "", points_required: 100, is_active: true });
      alert("Reward created successfully!");
    } catch (error) {
      console.error("Error creating reward:", error);
      alert("Failed to create reward. Please check your permissions.");
    }
  };

  const handleToggleActive = async (rewardId, currentStatus) => {
    try {
      const { supabase } = require("@/app/lib/supabase");
      
      const { error } = await supabase
        .from('rewards')
        .update({ is_active: !currentStatus })
        .eq('id', rewardId);
      
      if (error) throw error;
      
      // Update local state
      setRewards(rewards.map(reward => 
        reward.id === rewardId ? { ...reward, is_active: !currentStatus } : reward
      ));
    } catch (error) {
      console.error("Error updating reward:", error);
      alert("Failed to update reward. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rewards store...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-700 mb-6">Rewards Store</h1>
        <p className="text-gray-600 mb-8">Manage rewards that children can redeem with their points.</p>
        
        {/* Create Reward Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Add New Reward</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reward Title</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-3"
                value={newReward.title}
                onChange={(e) => setNewReward({...newReward, title: e.target.value})}
                placeholder="e.g., Pizza Night"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Points Required</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg p-3"
                value={newReward.points_required}
                onChange={(e) => setNewReward({...newReward, points_required: parseInt(e.target.value) || 0})}
                min="1"
                placeholder="e.g., 150"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-3"
                value={newReward.description}
                onChange={(e) => setNewReward({...newReward, description: e.target.value})}
                placeholder="e.g., Choose any pizza"
              />
            </div>
          </div>
          <button
            onClick={handleCreateReward}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700"
          >
            + Add Reward
          </button>
        </div>
        
        {/* Rewards List */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6">Manage Rewards</h2>
          
          {rewards.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No rewards created yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Create your first reward using the form above
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rewards.map((reward) => (
                <div key={reward.id} className={`border rounded-xl p-6 ${reward.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-purple-700">{reward.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{reward.description}</p>
                      <div className="mt-2">
                        <span className="bg-purple-100 text-purple-800 py-1 px-3 rounded-full text-sm font-bold">
                          {reward.points_required} points
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleActive(reward.id, reward.is_active)}
                      className={`px-4 py-2 rounded-lg font-bold ${reward.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      {reward.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <div className="text-sm text-gray-500">
                    Created: {new Date(reward.created_at).toLocaleDateString()}
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
