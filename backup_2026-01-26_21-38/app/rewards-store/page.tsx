"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RewardsStorePage() {
  const router = useRouter();
  
  // Note: In production, add proper authentication here

  const [pendingApprovals, setPendingApprovals] = useState([
    {
      id: 1,
      name: "Video Game Hour",
      requestedBy: "Alex",
      points: 50,
      icon: "fas fa-gamepad",
      iconBg: "#E0F7FA"
    },
    {
      id: 2,
      name: "Movie Night",
      requestedBy: "Sam",
      points: 75,
      icon: "fas fa-film",
      iconBg: "#FFEBEE"
    },
    {
      id: 3,
      name: "Ice Cream Trip",
      requestedBy: "Jordan",
      points: 40,
      icon: "fas fa-ice-cream",
      iconBg: "#F3E5F5"
    }
  ]);

  const [rewards, setRewards] = useState([
    { id: 1, name: "New Book", description: "Pick out a brand new book from the bookstore", points: 120, icon: "fas fa-book", stock: 5 },
    { id: 2, name: "Extra Game Time", description: "30 minutes of extra video game time", points: 80, icon: "fas fa-gamepad", stock: 10 },
    { id: 3, name: "Movie Choice", description: "Choose the movie for family movie night", points: 100, icon: "fas fa-film", stock: 8 },
    { id: 4, name: "Park Day", description: "Special trip to the park with friends", points: 60, icon: "fas fa-tree", stock: 15 },
    { id: 5, name: "Bake Cookies", description: "Bake and decorate cookies together", points: 90, icon: "fas fa-cookie-bite", stock: 6 },
    { id: 6, name: "Stay Up Late", description: "Stay up 30 minutes past bedtime", points: 150, icon: "fas fa-moon", stock: 12 },
  ]);

  const [newReward, setNewReward] = useState({ name: "", description: "", points: 0, stock: 1 });

  const approveRequest = (id: number) => {
    setPendingApprovals(pendingApprovals.filter(req => req.id !== id));
    alert("Reward approved! Points have been deducted.");
  };

  const denyRequest = (id: number) => {
    setPendingApprovals(pendingApprovals.filter(req => req.id !== id));
    alert("Reward request denied.");
  };

  const addReward = () => {
    if (newReward.name && newReward.description && newReward.points > 0) {
      const newId = rewards.length > 0 ? Math.max(...rewards.map(r => r.id)) + 1 : 1;
      setRewards([...rewards, {
        id: newId,
        name: newReward.name,
        description: newReward.description,
        points: newReward.points,
        icon: "fas fa-gift",
        stock: newReward.stock
      }]);
      setNewReward({ name: "", description: "", points: 0, stock: 1 });
      alert("New reward added to store!");
    }
  };

  const removeReward = (id: number) => {
    if (confirm("Are you sure you want to remove this reward from the store?")) {
      setRewards(rewards.filter(reward => reward.id !== id));
    }
  };

  const updateStock = (id: number, change: number) => {
    setRewards(rewards.map(reward => 
      reward.id === id ? { ...reward, stock: Math.max(0, reward.stock + change) } : reward
    ));
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
        {/* Pending Approvals Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#006372] flex items-center gap-3">
              <i className="fas fa-clock"></i>
              Pending Approvals
              <span className="bg-[#00C2E0] text-white text-sm px-3 py-1 rounded-full">
                {pendingApprovals.length} requests
              </span>
            </h2>
            <div className="text-gray-600">
              Children are waiting for your approval!
            </div>
          </div>

          {pendingApprovals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingApprovals.map((request) => (
                <div key={request.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: request.iconBg }}>
                        <i className={`${request.icon} text-xl`}></i>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{request.name}</h3>
                        <p className="text-sm text-gray-600">Requested by: <span className="font-bold">{request.requestedBy}</span></p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#00C2E0]">{request.points}</div>
                      <div className="text-sm text-gray-500">points</div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => approveRequest(request.id)}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2.5 rounded-lg font-bold hover:opacity-90"
                    >
                      <i className="fas fa-check mr-2"></i> Approve
                    </button>
                    <button
                      onClick={() => denyRequest(request.id)}
                      className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white py-2.5 rounded-lg font-bold hover:opacity-90"
                    >
                      <i className="fas fa-times mr-2"></i> Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-8 text-center">
              <i className="fas fa-check-circle text-4xl text-green-500 mb-4"></i>
              <h3 className="text-xl font-bold text-green-800 mb-2">All Caught Up!</h3>
              <p className="text-green-700">No pending reward requests at the moment.</p>
            </div>
          )}
        </div>

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
                      value={newReward.name}
                      onChange={(e) => setNewReward({...newReward, name: e.target.value})}
                      className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
                      placeholder="e.g., Special Pizza Night"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Point Cost *</label>
                    <input
                      type="number"
                      value={newReward.points}
                      onChange={(e) => setNewReward({...newReward, points: parseInt(e.target.value) || 0})}
                      className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
                      placeholder="Enter points required"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={newReward.description}
                    onChange={(e) => setNewReward({...newReward, description: e.target.value})}
                    className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
                    rows={3}
                    placeholder="Describe what the child earns with this reward..."
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Initial Stock</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setNewReward({...newReward, stock: Math.max(1, newReward.stock - 1)})}
                        className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"
                      >
                        <i className="fas fa-minus"></i>
                      </button>
                      <input
                        type="number"
                        value={newReward.stock}
                        onChange={(e) => setNewReward({...newReward, stock: parseInt(e.target.value) || 1})}
                        className="w-24 p-3 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
                        min="1"
                      />
                      <button
                        onClick={() => setNewReward({...newReward, stock: newReward.stock + 1})}
                        className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={addReward}
                    disabled={!newReward.name || !newReward.description || newReward.points <= 0}
                    className={`px-8 py-3.5 rounded-xl font-bold transition ${
                      newReward.name && newReward.description && newReward.points > 0
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rewards.map((reward) => (
                  <div key={reward.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition bg-gradient-to-br from-cyan-50 to-teal-50">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#00C2E0]/20 to-[#006372]/20 flex items-center justify-center">
                          <i className={`${reward.icon} text-[#006372]`}></i>
                        </div>
                        <div>
                          <h3 className="font-bold text-[#006372] text-lg">{reward.name}</h3>
                          <p className="text-gray-600 text-sm mt-1">{reward.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#00C2E0]">{reward.points}</div>
                        <div className="text-sm text-gray-500">points</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-700">
                          Stock: <span className="font-bold">{reward.stock}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateStock(reward.id, -1)}
                            className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center hover:bg-gray-200"
                            disabled={reward.stock <= 0}
                          >
                            <i className="fas fa-minus text-xs"></i>
                          </button>
                          <button
                            onClick={() => updateStock(reward.id, 1)}
                            className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center hover:bg-gray-200"
                          >
                            <i className="fas fa-plus text-xs"></i>
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeReward(reward.id)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                      >
                        <i className="fas fa-trash mr-2"></i> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
                    {rewards.length > 0 ? Math.round(rewards.reduce((sum, r) => sum + r.points, 0) / rewards.length) : 0}
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-[#00C2E0]/30">
                  <div className="text-sm text-gray-600">Total Stock Available</div>
                  <div className="text-3xl font-bold text-[#006372] mt-2">
                    {rewards.reduce((sum, r) => sum + r.stock, 0)}
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-[#00C2E0]/30">
                  <div className="text-sm text-gray-600">Pending Approvals</div>
                  <div className="text-3xl font-bold text-[#006372] mt-2">{pendingApprovals.length}</div>
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

