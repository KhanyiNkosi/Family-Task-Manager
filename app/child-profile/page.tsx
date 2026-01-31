"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ChildProfilePage() {
  const [activeTab, setActiveTab] = useState<"profile" | "activity">("profile");
  const [profileImage, setProfileImage] = useState("");
  const [tempImage, setTempImage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const savedImage = localStorage.getItem("childProfileImage") || "";
    setProfileImage(savedImage);
    setIsClient(true);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setTempImage(result);
        setIsEditing(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setProfileImage(tempImage);
    localStorage.setItem("childProfileImage", tempImage);
    setIsEditing(false);
    alert("Profile picture saved!");
  };

  const handleCancel = () => {
    setTempImage("");
    setIsEditing(false);
  };

  const handleRemove = () => {
    setProfileImage("");
    localStorage.removeItem("childProfileImage");
    alert("Profile picture removed!");
  };

  const navItems = [
    { href: "/", icon: "fas fa-home", label: "Home" },
    { href: "/child-dashboard", icon: "fas fa-th-large", label: "My Dashboard" },
    { href: "/my-rewards", icon: "fas fa-gift", label: "My Rewards" },
    { href: "/child-profile", icon: "fas fa-user", label: "My Profile" },
  ];

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      alert("Logged out! (In a real app, this would clear session)");
      router.push("/");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Matching /profile design */}
      <aside className="sidebar w-64 bg-[#006372] text-white flex flex-col py-6">
        <div className="sidebar-brand px-6 pb-10 text-2xl font-black flex items-center gap-2.5">
          <i className="far fa-smile-beam"></i> FamilyTask
        </div>

        <nav className="flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-item px-6 py-3 flex items-center gap-3.5 text-white/80 no-underline text-base hover:bg-white/5 transition-colors"
            >
              <i className={item.icon}></i> {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer mt-auto pt-5 border-t border-white/10">
          <Link
            href="/child-profile"
            className="nav-item px-6 py-3 flex items-center gap-3.5 text-white/80 no-underline text-base hover:bg-white/5 transition-colors"
          >
            <i className="fas fa-cog"></i> My Settings
          </Link>
          <button
            onClick={handleLogout}
            className="nav-item px-6 py-3 flex items-center gap-3.5 text-white/80 no-underline text-base hover:bg-white/5 transition-colors w-full text-left"
          >
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <header className="page-header px-10 py-5 flex justify-between items-center bg-white border-b border-[#e2e8f0]">
          <Link
            href="/child-dashboard"
            className="breadcrumb flex items-center gap-2 text-[#00C2E0] font-bold no-underline text-lg"
          >
            <i className="fas fa-chevron-left"></i> My Profile
          </Link>
          <div className="header-actions flex items-center gap-4">
            
            <div className="user-avatar-small w-10 h-10 rounded-full bg-[#E0F7FA] text-[#00C2E0] flex items-center justify-center font-bold border border-[#B2EBF2] overflow-hidden">
              {isClient && profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <i className="fas fa-user"></i>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="content-body px-10 py-8 max-w-5xl">
          <h1 className="view-title text-3xl font-black text-[#00C2E0] flex items-center gap-3 mb-1">
            <i className="far fa-user"></i> My Profile
          </h1>
          <p className="view-subtitle text-[#64748b] text-base mb-8">
            Manage your profile picture and view your progress.
          </p>

          {/* Tabs */}
          <div className="tabs-container bg-[#eef2f6] p-1.5 rounded-xl flex gap-1 mb-8">
            <button
              onClick={() => setActiveTab("profile")}
              className={`tab-button flex-1 py-3.5 px-4 rounded-lg text-base font-bold transition-colors ${activeTab === "profile" ? "bg-white text-[#00C2E0] shadow-sm" : "text-[#64748b] hover:text-[#00C2E0]"}`}
            >
              <i className="far fa-user mr-2.5"></i> My Profile
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`tab-button flex-1 py-3.5 px-4 rounded-lg text-base font-bold transition-colors ${activeTab === "activity" ? "bg-white text-[#00C2E0] shadow-sm" : "text-[#64748b] hover:text-[#00C2E0]"}`}
            >
              <i className="fas fa-chart-line mr-2.5"></i> My Activity
            </button>
          </div>

          {/* Profile Tab Content */}
          {activeTab === "profile" && (
            <div className="profile-content">
              <div className="profile-card bg-white rounded-2xl shadow-sm border border-[#e2e8f0] p-8 mb-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                  {/* Profile Picture Section */}
                  <div className="flex-shrink-0 text-center">
                    <div className="relative mb-6">
                      <div className="w-48 h-48 rounded-2xl flex items-center justify-center mb-4 mx-auto overflow-hidden relative border-4 border-[#E0F7FA] bg-gradient-to-br from-[#00C2E0] to-[#00A8C2]">
                        {isClient ? (
                          <div className="w-full h-full">
                            {isEditing && tempImage ? (
                              <img 
                                src={tempImage} 
                                alt="Preview" 
                                className="w-full h-full object-cover"
                              />
                            ) : profileImage ? (
                              <img 
                                src={profileImage} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <i className="fas fa-user text-white text-8xl"></i>
                              </div>
                            )}
                            
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all flex items-end justify-end p-4">
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-shadow hover:scale-105"
                                title="Change photo"
                              >
                                <i className="fas fa-camera text-[#00C2E0] text-lg"></i>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <i className="fas fa-user text-white text-8xl"></i>
                          </div>
                        )}
                      </div>
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                      />
                    </div>
                    
                    <h3 className="text-2xl font-black text-gray-800 mb-1">Child Name</h3>
                    <p className="text-[#64748b] text-base mb-6">Family Member</p>
                    
                    {isEditing && (
                      <div className="space-y-3 mb-6">
                        <button
                          onClick={handleSave}
                          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-3"
                        >
                          <i className="fas fa-save"></i>
                          Save Profile Picture
                        </button>
                        <button
                          onClick={handleCancel}
                          className="w-full bg-gradient-to-r from-gray-0 to-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-300 transition-all flex items-center justify-center gap-2 border border-gray-300"
                        >
                          <i className="fas fa-times"></i>
                          Cancel
                        </button>
                      </div>
                    )}
                    
                    {!isEditing && profileImage && (
                      <button
                        onClick={handleRemove}
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-3 mb-6"
                      >
                        <i className="fas fa-trash"></i>
                        Remove Profile Picture
                      </button>
                    )}
                    
                    <p className="text-sm text-gray-500 max-w-xs">
                      Click the camera icon to upload a new profile picture.
                      {isEditing && " Click 'Save' to confirm your selection."}
                    </p>
                  </div>

                  {/* Stats Section */}
                  <div className="flex-1">
                    <h2 className="text-2xl font-black text-gray-800 mb-6">My Progress</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="stat-card bg-gradient-to-br from-[#E0F7FA] to-[#B2EBF2] p-6 rounded-xl border border-[#B2EBF2]">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-[#006372] text-sm font-medium">Total Points</p>
                            <p className="text-4xl font-black text-[#00A8C2]">0</p>
                          </div>
                          <i className="fas fa-star text-3xl text-yellow-500"></i>
                        </div>
                        <button className="w-full bg-[#00C2E0] text-white py-3 rounded-lg hover:bg-[#00A8C2] transition font-bold">
                          My Rewards
                        </button>
                      </div>

                      <div className="stat-card bg-gradient-to-br from-[#E0F7FA] to-[#B2EBF2] p-6 rounded-xl border border-[#B2EBF2]">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-[#006372] text-sm font-medium">Tasks Done</p>
                            <p className="text-4xl font-black text-[#00A8C2]">0</p>
                          </div>
                          <i className="fas fa-check-circle text-3xl text-[#00C2E0]"></i>
                        </div>
                        <button className="w-full bg-[#00C2E0] text-white py-3 rounded-lg hover:bg-[#00A8C2] transition font-bold">
                          View Tasks
                        </button>
                      </div>

                      <div className="stat-card bg-gradient-to-br from-[#E0F7FA] to-[#B2EBF2] p-6 rounded-xl border border-[#B2EBF2] md:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-[#006372] text-sm font-medium">Level</p>
                            <p className="text-4xl font-black text-[#00A8C2]">1</p>
                          </div>
                          <i className="fas fa-trophy text-3xl text-[#00C2E0]"></i>
                        </div>
                        <div className="mb-4">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-gradient-to-r from-[#00C2E0] to-[#00A8C2] h-3 rounded-full" 
                              style={{ width: "75%" }}
                            ></div>
                          </div>
                          <p className="text-sm text-[#64748b] mt-2">0/100 points to level 2</p>
                        </div>
                        <button className="w-full bg-[#00C2E0] text-white py-3 rounded-lg hover:bg-[#00A8C2] transition font-bold">
                          Level Up!
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Tab Content */}
          {activeTab === "activity" && (
            <div className="activity-content">
              <div className="activity-card bg-white rounded-2xl shadow-sm border border-[#e2e8f0] p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-gray-800">Recent Activity</h2>
                  <Link 
                    href="/child-dashboard"
                    className="text-[#00C2E0] hover:text-[#00A8C2] flex items-center gap-2 font-bold"
                  >
                    <span>See All</span>
                    <i className="fas fa-arrow-right"></i>
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {[
                    { type: "task", title: "Completed Task", points: "+0", time: "Recently", icon: "fa-check", color: "text-green-500" },
                    { type: "ai", title: "Completed Activity", points: "+0", time: "Recently", icon: "fa-robot", color: "text-purple-500" },
                    { type: "reward", title: "Redeemed Reward", points: "-0", time: "Recently", icon: "fa-gift", color: "text-[#00C2E0]" },
                    { type: "task", title: "Completed Chore", points: "+0", time: "Recently", icon: "fa-check", color: "text-green-500" },
                  ].map((activity, index) => (
                    <div key={index} className="activity-item flex items-center gap-4 p-4 border border-[#e2e8f0] rounded-xl hover:bg-[#f8fafc] transition">
                      <div className={`activity-icon w-12 h-12 bg-[#E0F7FA] rounded-full flex items-center justify-center ${activity.color}`}>
                        <i className={`fas ${activity.icon}`}></i>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800">{activity.title}</h4>
                        <p className="text-sm text-[#64748b]">{activity.time}</p>
                      </div>
                      <span className={`font-black text-lg ${activity.points.startsWith("+") ? "text-green-600" : "text-red-500"}`}>
                        {activity.points}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}












