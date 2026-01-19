"use client";

import { useState } from "react";

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<"dashboard" | "tasks" | "rewards">("dashboard");
  const [pendingCount, setPendingCount] = useState(1);
  const [totalPoints, setTotalPoints] = useState(212);
  const [rewards, setRewards] = useState([
    { id: "req-1", child: "C", name: "Video Game Hour", points: 50 }
  ]);
  const [bulletinMessages, setBulletinMessages] = useState([
    { user: "C", message: "Can we get pizza for movie night? 🍕" },
    { user: "M", message: "Family movie night this Friday!" }
  ]);
  const [tasks, setTasks] = useState([
    { id: 1, name: "Homework", points: 10 }
  ]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ name: "", points: "" });

  const switchView = (view: "dashboard" | "tasks" | "rewards") => {
    setActiveView(view);
  };

  const approveReward = (id: string, points: number) => {
    setTotalPoints(prev => prev + points);
    setRewards(prev => prev.filter(reward => reward.id !== id));
  };

  const removeReward = (id: string) => {
    setRewards(prev => prev.filter(reward => reward.id !== id));
  };

  const postBulletin = (message: string) => {
    if (!message.trim()) return;
    setBulletinMessages(prev => [
      ...prev,
      { user: "M", message }
    ]);
  };

  const saveNewTask = () => {
    if (!newTask.name.trim() || !newTask.points) return;
    
    const newTaskObj = {
      id: tasks.length + 1,
      name: newTask.name,
      points: parseInt(newTask.points)
    };
    
    setTasks(prev => [newTaskObj, ...prev]);
    setPendingCount(prev => prev + 1);
    setNewTask({ name: "", points: "" });
    setShowTaskModal(false);
    
    alert("Task Assigned!");
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const navItems = [
    { id: "dashboard", icon: "🏠", label: "Home" },
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "tasks", icon: "📝", label: "My Tasks" },
    { id: "rewards", icon: "🎁", label: "Rewards Store" },
    { id: "dashboard", icon: "🤖", label: "AI Suggester" }
  ];

  const sidebarFooter = [
    { icon: "ℹ️", label: "About" },
    { icon: "⚙️", label: "Settings" },
    { icon: "🚪", label: "Logout" }
  ];

  const rewardItems = [
    { icon: "🍦", name: "Ice Cream", points: 50 },
    { icon: "📚", name: "New Book", points: 100 },
    { icon: "🎮", name: "Gaming Time", points: 75 }
  ];

  return (
    <div className="font-inter bg-[#E2EEF1] min-h-screen">
      <div className="dashboard-container flex">
        {/* Sidebar */}
        <aside className="sidebar w-64 bg-[#006372] p-6 text-white sticky top-0 h-screen flex flex-col">
          <div className="logo flex items-center gap-3 text-2xl font-black mb-8 pl-2">
            <span className="text-2xl">😊</span>
            <span>FamilyTask</span>
          </div>
          
          <nav className="flex-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => switchView(item.id as any)}
                className={`nav-link flex items-center gap-3 p-3 rounded-xl mb-1 w-full text-left transition-all ${
                  activeView === item.id 
                    ? "bg-white/15 text-white" 
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="sidebar-footer border-t border-white/10 pt-4 mt-4">
            {sidebarFooter.map((item) => (
              <button
                key={item.label}
                className="nav-link flex items-center gap-3 p-3 rounded-xl mb-1 w-full text-left text-white/80 hover:bg-white/10 transition-all"
              >
                <span>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content flex-1 p-8 overflow-auto">
          {/* Dashboard View */}
          {activeView === "dashboard" && (
            <div className="space-y-6">
              {/* Top Navigation */}
              <div className="top-nav flex justify-between items-center mb-6">
                <h1 className="view-title text-3xl font-black text-[#00C2E0]">
                  Parent Dashboard
                </h1>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowTaskModal(true)}
                    className="btn-create bg-[#00C2E0] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all"
                  >
                    <span className="text-lg">➕</span>
                    Create Task
                  </button>
                  <button className="text-gray-500 text-xl">
                    🔔
                  </button>
                  <div className="avatar w-12 h-12 bg-[#E0F7FA] text-[#00C2E0] rounded-full flex items-center justify-center font-bold border-2 border-white">
                    M
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="stats-row grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stat-card bg-white p-6 rounded-3xl shadow-lg relative">
                  <h4 className="text-gray-500 text-xs uppercase tracking-wider mb-2">
                    Tasks Completed
                  </h4>
                  <div className="value text-4xl font-black">3</div>
                  <div className="icon-bg absolute right-6 top-1/2 transform -translate-y-1/2 text-4xl text-[#00C2E0] opacity-10">
                    ✓
                  </div>
                </div>
                
                <div className="stat-card bg-white p-6 rounded-3xl shadow-lg relative">
                  <h4 className="text-gray-500 text-xs uppercase tracking-wider mb-2">
                    Tasks Pending
                  </h4>
                  <div className="value text-4xl font-black">{pendingCount}</div>
                  <div className="icon-bg absolute right-6 top-1/2 transform -translate-y-1/2 text-4xl text-[#00C2E0] opacity-10">
                    ⏰
                  </div>
                </div>
                
                <div className="stat-card bg-white p-6 rounded-3xl shadow-lg relative">
                  <h4 className="text-gray-500 text-xs uppercase tracking-wider mb-2">
                    Total Points Awarded
                  </h4>
                  <div className="value text-4xl font-black">{totalPoints}</div>
                  <div className="icon-bg absolute right-6 top-1/2 transform -translate-y-1/2 text-4xl text-[#00C2E0] opacity-10">
                    ⭐
                  </div>
                </div>
              </div>

              {/* Reward Requests */}
              <div className="section-box bg-white p-6 rounded-3xl shadow-lg">
                <div className="section-header flex items-center gap-3 text-2xl font-black text-[#00C2E0] mb-4">
                  <span>🤲</span>
                  Reward Requests
                </div>
                
                <div className="space-y-3">
                  {rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="item-row bg-[#F8FAFC] p-4 rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="avatar w-12 h-12 bg-[#E0F7FA] text-[#00C2E0] rounded-full flex items-center justify-center font-bold">
                          {reward.child}
                        </div>
                        <div>
                          <div className="font-bold">{reward.name}</div>
                          <div className="text-sm text-gray-500">Requested by Child</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="points-badge bg-[#00C2E0] text-white px-4 py-2 rounded-full font-bold flex items-center gap-2">
                          <span>⭐</span>
                          {reward.points} pts
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveReward(reward.id, reward.points)}
                            className="btn-circle w-10 h-10 rounded-xl border border-gray-300 hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => removeReward(reward.id)}
                            className="btn-circle w-10 h-10 rounded-xl border border-gray-300 hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Family Bulletin */}
              <div className="section-box bg-white p-6 rounded-3xl shadow-lg">
                <div className="section-header flex items-center gap-3 text-2xl font-black text-[#00C2E0] mb-4">
                  <span>📢</span>
                  Family Bulletin
                </div>
                
                <div className="space-y-3 mb-4">
                  {bulletinMessages.map((msg, index) => (
                    <div key={index} className="bulletin-bubble bg-[#F8FAFC] p-3 rounded-3xl flex items-center gap-3">
                      <div className={`avatar w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        msg.user === "M" ? "bg-yellow-400" : "bg-[#E0F7FA] text-[#00C2E0]"
                      }`}>
                        {msg.user}
                      </div>
                      <span>{msg.message}</span>
                    </div>
                  ))}
                </div>
                
                <div className="bulletin-input-area flex gap-3">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 p-3 rounded-xl border border-gray-300 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        postBulletin(e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector("input") as HTMLInputElement;
                      if (input?.value.trim()) {
                        postBulletin(input.value);
                        input.value = "";
                      }
                    }}
                    className="btn-post bg-[#00C2E0] text-white px-6 py-3 rounded-xl font-bold"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tasks View */}
          {activeView === "tasks" && (
            <div>
              <h1 className="view-title text-3xl font-black text-[#00C2E0] mb-6">
                Task Management
              </h1>
              
              <div className="section-box bg-white p-6 rounded-3xl shadow-lg">
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="item-row bg-[#F8FAFC] p-4 rounded-2xl flex items-center justify-between"
                    >
                      <span className="font-medium">{task.name}</span>
                      <div className="points-badge bg-[#00C2E0] text-white px-4 py-2 rounded-full font-bold flex items-center gap-2">
                        <span>⭐</span>
                        {task.points} pts
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Rewards View */}
          {activeView === "rewards" && (
            <div>
              <h1 className="view-title text-3xl font-black text-[#00C2E0] mb-6">
                Rewards Store
              </h1>
              
              <div className="rewards-grid grid grid-cols-1 md:grid-cols-3 gap-4">
                {rewardItems.map((item, index) => (
                  <div
                    key={index}
                    className="reward-item bg-[#F8FAFC] p-6 rounded-2xl text-center border border-gray-200"
                  >
                    <div className="text-4xl mb-3">{item.icon}</div>
                    <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                    <p className="text-gray-600 font-medium">{item.points} pts</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="modal-content bg-white p-6 rounded-3xl shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-black text-[#00C2E0] mb-4">
              New Task
            </h2>
            
            <input
              type="text"
              placeholder="Task Name"
              className="w-full p-3 mb-3 rounded-xl border border-gray-300 outline-none"
              value={newTask.name}
              onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
            />
            
            <input
              type="number"
              placeholder="Points"
              className="w-full p-3 mb-4 rounded-xl border border-gray-300 outline-none"
              value={newTask.points}
              onChange={(e) => setNewTask({ ...newTask, points: e.target.value })}
            />
            
            <div className="flex gap-3">
              <button
                onClick={saveNewTask}
                className="flex-1 bg-[#00C2E0] text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all"
              >
                Create
              </button>
              <button
                onClick={() => setShowTaskModal(false)}
                className="flex-1 border border-gray-300 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}