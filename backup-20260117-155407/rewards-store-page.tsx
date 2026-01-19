"use client";

import { useState, useEffect } from "react";
import ChildSidebar from "@/app/components/ChildSidebar";

type Reward = {
  id: number;
  name: string;
  description: string;
  points: number;
  category: string;
};

export default function RewardsStorePage() {
  const [activeView, setActiveView] = useState("rewards");
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    // Simulate loading rewards
    setTimeout(() => {
      setRewards([
        { id: 1, name: "Movie Night", description: "Choose any movie for family night", points: 500, category: "Entertainment" },
        { id: 2, name: "Extra Screen Time", description: "1 hour of extra screen time", points: 300, category: "Entertainment" },
        { id: 3, name: "Favorite Meal", description: "Mom or Dad cooks your favorite meal", points: 400, category: "Food" },
        { id: 4, name: "Toy Store Trip", description: "Trip to toy store with $50 budget", points: 1000, category: "Toys" },
        { id: 5, name: "Stay Up Late", description: "Stay up 1 hour past bedtime", points: 250, category: "Privileges" },
        { id: 6, name: "Game Day", description: "Choose any game for family game day", points: 350, category: "Entertainment" },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredRewards = filter === "all" 
    ? rewards 
    : rewards.filter(reward => reward.category === filter);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <ChildSidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="flex-1 p-8 ml-[260px]">
          <div className="flex items-center justify-center h-full">
            <p className="mt-4 text-[#142229]">Loading rewards store...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <ChildSidebar activeView={activeView} onViewChange={setActiveView} />
      
      <main className="flex-1 p-8 ml-[260px] bg-gradient-to-b from-[#F0F9FF] to-[#D8EEFE]">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#00C2E0] mb-2">Rewards Store</h1>
          <p className="text-[#4A5568]">Exchange your points for awesome rewards!</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium ${filter === "all" ? "bg-[#00C2E0] text-white" : "bg-white text-[#4A5568] border border-[#E2E8F0]"}`}
          >
            All Rewards
          </button>
          <button
            onClick={() => setFilter("Entertainment")}
            className={`px-4 py-2 rounded-lg font-medium ${filter === "Entertainment" ? "bg-[#00C2E0] text-white" : "bg-white text-[#4A5568] border border-[#E2E8F0]"}`}
          >
            Entertainment
          </button>
          <button
            onClick={() => setFilter("Food")}
            className={`px-4 py-2 rounded-lg font-medium ${filter === "Food" ? "bg-[#00C2E0] text-white" : "bg-white text-[#4A5568] border border-[#E2E8F0]"}`}
          >
            Food
          </button>
          <button
            onClick={() => setFilter("Toys")}
            className={`px-4 py-2 rounded-lg font-medium ${filter === "Toys" ? "bg-[#00C2E0] text-white" : "bg-white text-[#4A5568] border border-[#E2E8F0]"}`}
          >
            Toys
          </button>
          <button
            onClick={() => setFilter("Privileges")}
            className={`px-4 py-2 rounded-lg font-medium ${filter === "Privileges" ? "bg-[#00C2E0] text-white" : "bg-white text-[#4A5568] border border-[#E2E8F0]"}`}
          >
            Privileges
          </button>
        </div>

        {/* Rewards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRewards.map((reward) => (
            <div key={reward.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-[#142229]">{reward.name}</h3>
                <span className="bg-[#00C2E0]/10 text-[#00C2E0] font-bold px-3 py-1 rounded-full">
                  {reward.points} pts
                </span>
              </div>
              <p className="text-[#4A5568] mb-4">{reward.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[#718096] bg-[#F7FAFC] px-3 py-1 rounded-full">
                  {reward.category}
                </span>
                <button className="bg-[#00C2E0] hover:bg-[#0099B8] text-white font-medium px-4 py-2 rounded-lg transition-colors">
                  Redeem Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Points Balance */}
        <div className="mt-10 p-6 bg-gradient-to-r from-[#00C2E0] to-[#0099B8] rounded-2xl text-white">
          <h2 className="text-2xl font-bold mb-2">Your Points Balance</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-black">1,250</p>
              <p className="text-white/80">Available points</p>
            </div>
            <button className="bg-white text-[#00C2E0] font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors">
              Earn More Points
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
