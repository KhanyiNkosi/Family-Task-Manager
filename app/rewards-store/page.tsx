"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function RewardsStorePage() {
  const [pendingApprovals, setPendingApprovals] = useState([
    { 
      id: 1, 
      name: "Video Game Hour", 
      requestedBy: "Child", 
      points: 50, 
      icon: "fas fa-ice-cream",
      iconBg: "#E0F7FA"
    }
  ]);

  const [rewards, setRewards] = useState([
    { id: 1, name: "New Book", description: "Pick out a brand new book...", points: 120, icon: "fas fa-book" },
    { id: 2, name: "Movie Night Pick", description: "You get to choose the movie...", points: 75, icon: "fas fa-film" },
    { id: 3, name: "Ice Cream Trip", description: "A special trip to your favorite...", points: 100, icon: "fas fa-ice-cream" },
    { id: 4, name: "Video Game Hour", description: "One hour of extra video game...", points: 50, icon: "fas fa-gamepad" }
  ]);

  const [showNewRewardModal, setShowNewRewardModal] = useState(false);
  const [newReward, setNewReward] = useState({ name: "", description: "", points: "", icon: "fas fa-gift" });

  const pathname = usePathname();
  
  const navItems = [
    { href: "/dashboard", icon: "fas fa-grid-2", label: "Dashboard" },
    { href: "/tasks", icon: "fas fa-list-check", label: "Tasks" },
    { href: "/rewards-store", icon: "fas fa-trophy", label: "Rewards Store" },
    { href: "/ai-suggester", icon: "fas fa-brain", label: "AI Suggester" },
  ];

  const handleApprove = (approvalId: number) => {
    setPendingApprovals(pendingApprovals.filter(approval => approval.id !== approvalId));
    alert("Reward request approved!");
  };

  const handleReject = (approvalId: number) => {
    setPendingApprovals(pendingApprovals.filter(approval => approval.id !== approvalId));
    alert("Reward request rejected.");
  };

  const handleDeleteReward = (rewardId: number) => {
    if (confirm("Are you sure you want to delete this reward?")) {
      setRewards(rewards.filter(reward => reward.id !== rewardId));
      alert("Reward deleted!");
    }
  };

  const handleCreateReward = () => {
    if (newReward.name && newReward.description && newReward.points) {
      const newId = rewards.length > 0 ? Math.max(...rewards.map(r => r.id)) + 1 : 1;
      setRewards([...rewards, {
        id: newId,
        name: newReward.name,
        description: newReward.description,
        points: parseInt(newReward.points),
        icon: newReward.icon
      }]);
      setNewReward({ name: "", description: "", points: "", icon: "fas fa-gift" });
      setShowNewRewardModal(false);
      alert("New reward created!");
    } else {
      alert("Please fill in all fields.");
    }
  };

  const iconOptions = [
    { value: "fas fa-book", label: "Book" },
    { value: "fas fa-film", label: "Movie" },
    { value: "fas fa-ice-cream", label: "Ice Cream" },
    { value: "fas fa-gamepad", label: "Game" },
    { value: "fas fa-gift", label: "Gift" },
    { value: "fas fa-pizza-slice", label: "Pizza" },
    { value: "fas fa-tv", label: "TV" },
    { value: "fas fa-bicycle", label: "Bike" },
  ];

  return (
    <div className="dashboard-container">
      <aside className="sidebar bg-[#006372] p-10 flex flex-col sticky top-0 h-screen">
        <div className="logo flex items-center gap-3 text-2xl font-bold text-white mb-12">
          <i className="fas fa-shapes"></i> FamilyTask
        </div>
        
        <nav className="flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link flex items-center gap-3.5 px-4 py-3.5 no-underline rounded-xl mb-2 font-medium ${pathname === item.href ? "bg-white/12" : ""}`}
            >
              <i className={item.icon}></i> {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="main-content p-10">
        <div className="top-nav flex justify-between items-center mb-9">
          {/* Fixed: Changed color to match "Reward Approval" heading */}
          <h1 className="text-3xl font-black text-[#00C2E0]">Rewards Management</h1>
          <button 
            onClick={() => setShowNewRewardModal(true)}
            className="btn-create bg-[#00C2E0] text-white border-none px-6 py-3 rounded-xl font-bold cursor-pointer flex items-center gap-2.5"
          >
            <i className="fas fa-plus"></i> New Reward
          </button>
        </div>

        {/* Reward Approval Section */}
        <div className="section-box bg-white rounded-2xl p-8 shadow-lg mb-9">
          <div className="section-title flex items-center gap-3 text-2xl font-black text-[#00C2E0] mb-3">
            <i className="fas fa-clock-rotate-left"></i> Reward Approval
          </div>
          <p className="subtitle text-[#5A6A7E] text-sm mb-5 uppercase tracking-wider">
            Pending Approval ({pendingApprovals.length})
          </p>
          
          {pendingApprovals.length > 0 ? (
            pendingApprovals.map((approval) => (
              <div key={approval.id} className="approval-card bg-[#F1F5F9] rounded-xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div 
                    className="reward-icon-box w-11 h-11 rounded-lg flex items-center justify-center text-[#00C2E0] text-xl"
                    style={{ backgroundColor: approval.iconBg }}
                  >
                    <i className={approval.icon}></i>
                  </div>
                  <div>
                    <div className="font-bold">{approval.name}</div>
                    <div className="text-sm text-[#5A6A7E]">Requested by {approval.requestedBy}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="pts-tag bg-[#00C2E0] text-white px-3.5 py-2 rounded-full text-sm font-bold flex items-center gap-1.5">
                    <i className="fas fa-star text-[#FFC107]"></i> {approval.points} pts
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleApprove(approval.id)}
                      className="text-[#00C2E0] border border-[#00C2E0] w-9 h-9 rounded-lg bg-white cursor-pointer flex items-center justify-center"
                    >
                      <i className="fas fa-check"></i>
                    </button>
                    <button 
                      onClick={() => handleReject(approval.id)}
                      className="text-[#F56565] border border-[#F56565] w-9 h-9 rounded-lg bg-white cursor-pointer flex items-center justify-center"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-[#5A6A7E]">
              <i className="fas fa-check-circle text-3xl text-green-500 mb-3"></i>
              <p>No pending approvals. All caught up!</p>
            </div>
          )}
        </div>

        {/* Reward Store Section */}
        <div className="section-box bg-white rounded-2xl p-8 shadow-lg">
          <div className="section-title flex items-center gap-3 text-2xl font-black text-[#00C2E0] mb-3">
            <i className="fas fa-store"></i> Reward Store
          </div>
          <p className="subtitle text-[#5A6A7E] text-sm mb-5 uppercase tracking-wider">
            There are {rewards.length} rewards available in the shop.
          </p>

          <div className="reward-grid grid grid-cols-2 gap-5 mt-5">
            {rewards.map((reward) => (
              <div key={reward.id} className="reward-item bg-[#F1F5F9] rounded-xl p-5 flex items-center justify-between border border-transparent hover:border-[#00C2E0] hover:bg-white transition-all duration-300">
                <div className="reward-main flex items-center gap-4">
                  <div className="reward-icon-box w-11 h-11 bg-white rounded-lg flex items-center justify-center text-[#00C2E0] text-xl">
                    <i className={reward.icon}></i>
                  </div>
                  <div className="reward-details">
                    <h5 className="text-base font-bold mb-1">{reward.name}</h5>
                    <p className="text-sm text-[#5A6A7E]">{reward.description}</p>
                  </div>
                </div>
                <div className="reward-actions flex items-center gap-3">
                  <div className="pts-tag bg-[#00C2E0] text-white px-3.5 py-2 rounded-full text-sm font-bold flex items-center gap-1.5">
                    <i className="fas fa-star text-[#FFC107]"></i> {reward.points}
                  </div>
                  <button 
                    onClick={() => handleDeleteReward(reward.id)}
                    className="btn-delete text-[#F56565] bg-none border-none cursor-pointer text-base"
                  >
                    <i className="far fa-trash-can"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* New Reward Modal */}
        {showNewRewardModal && (
          <div className="modal fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="modal-content bg-white rounded-2xl p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold text-[#00C2E0] mb-6">Create New Reward</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reward Name</label>
                  <input
                    type="text"
                    value={newReward.name}
                    onChange={(e) => setNewReward({...newReward, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
                    placeholder="e.g., Movie Night"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newReward.description}
                    onChange={(e) => setNewReward({...newReward, description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
                    placeholder="Brief description of the reward..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Points Cost</label>
                  <input
                    type="number"
                    value={newReward.points}
                    onChange={(e) => setNewReward({...newReward, points: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
                    placeholder="e.g., 100"
                    min="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                  <div className="grid grid-cols-4 gap-2">
                    {iconOptions.map((icon) => (
                      <button
                        key={icon.value}
                        onClick={() => setNewReward({...newReward, icon: icon.value})}
                        className={`p-3 rounded-lg border ${newReward.icon === icon.value ? 'border-[#00C2E0] bg-[#00C2E0]/10' : 'border-gray-300'}`}
                      >
                        <i className={`${icon.value} text-xl ${newReward.icon === icon.value ? 'text-[#00C2E0]' : 'text-gray-500'}`}></i>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button
                  onClick={handleCreateReward}
                  className="flex-1 bg-[#00C2E0] text-white py-3 rounded-lg font-bold hover:bg-[#00A8C2] transition"
                >
                  Create Reward
                </button>
                <button
                  onClick={() => setShowNewRewardModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
