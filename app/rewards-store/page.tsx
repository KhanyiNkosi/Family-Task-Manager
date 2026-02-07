"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from '@/lib/supabaseClient';

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
}

export default function RewardsStorePage() {
  const router = useRouter();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [newRewardTitle, setNewRewardTitle] = useState("");
  const [newRewardDescription, setNewRewardDescription] = useState("");
  const [newRewardPoints, setNewRewardPoints] = useState("50");

  useEffect(() => {
    loadRewards();
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
      console.error('Error in loadRewards:', error);
    }
  };

  const handleCreateReward = async () => {
    if (!newRewardTitle.trim()) {
      alert('Please enter a reward title');
      return;
    }

    const pointsCost = parseInt(newRewardPoints);
    if (isNaN(pointsCost) || pointsCost <= 0) {
      alert('Please enter a valid points cost');
      return;
    }

    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('You must be logged in to create rewards');
        return;
      }

      // Get user's family_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user.id)
        .single();

      if (!profile?.family_id) {
        alert('Family ID not found');
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
        alert('Failed to create reward: ' + error.message);
        return;
      }

      if (newReward) {
        setRewards([newReward, ...rewards]);
        setNewRewardTitle('');
        setNewRewardDescription('');
        setNewRewardPoints('50');
        alert('Reward created successfully!');
      }
    } catch (error) {
      console.error('Error in handleCreateReward:', error);
      alert('Failed to create reward');
    }
  };

  const handleDeleteReward = async (rewardId: string) => {
    if (!confirm('Are you sure you want to delete this reward?')) return;

    try {
      const supabase = createClientSupabaseClient();
      
      // Instead of deleting, mark as inactive
      const { error } = await supabase
        .from('rewards')
        .update({ is_active: false })
        .eq('id', rewardId);

      if (error) {
        console.error('Error deleting reward:', error);
        alert('Failed to delete reward');
        return;
      }

      setRewards(rewards.filter(r => r.id !== rewardId));
      alert('Reward deleted successfully');
    } catch (error) {
      console.error('Error in handleDeleteReward:', error);
      alert('Failed to delete reward');
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
            <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl">
              <i className="fas fa-user-shield text-xl"></i>
              <div>
                <div className="font-bold">Parent Account</div>
                <div className="text-sm text-white/80">Full Access</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Rewards Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add New Reward Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#006372] flex items-center gap-3">
                  <i className="fas fa-plus-circle"></i>
                  Add New Reward
                </h2>
                <div className="text-sm text-gray-500">
                  {rewards.length} rewards in store
                </div>
              </div>

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
                          <h3 className="font-bold text-[#006372] text-lg">{reward.title}</h3>
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
                        <button
                          onClick={() => handleDeleteReward(reward.id)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                        >
                          <i className="fas fa-trash mr-2"></i> Remove
                        </button>
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
    </div>
  );
}


