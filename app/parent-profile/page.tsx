"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ParentProfilePage() {
  const [activeTab, setActiveTab] = useState<"profile" | "settings" | "family">("profile");
  const [selectedAvatar, setSelectedAvatar] = useState("parent");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [taskApproval, setTaskApproval] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [userRole, setUserRole] = useState<string>("loading");
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // FIXED PERMISSION CHECK - Only parents can access
  useEffect(() => {
    if (isClient) {
      const userRole = sessionStorage.getItem("userRole"); const role = userRole === null || userRole === undefined ? null : userRole;
      setUserRole(role);
      
      console.log("Current user role:", role);
      
      // ONLY allow "parent" role to access parent-profile
      // If not parent, redirect to appropriate page
      if (role !== "parent") {
        console.warn("Access denied: Parent-only area. User role:", role);
        
        // If child, redirect to child dashboard
        if (role === "child") {
          router.push("/child-dashboard");
        } 
        // If no role or other role, redirect to home
        else {
          router.push("/");
        }
        return;
      }
      
      console.log("Parent access granted to parent-profile");
    }
  }, [isClient, router]);

  const avatars = [
    { id: "parent", emoji: "👨‍👩‍👧‍👦", label: "Family" },
    { id: "manager", emoji: "👔", label: "Manager" },
    { id: "teacher", emoji: "👨‍🏫", label: "Teacher" },
    { id: "leader", emoji: "👑", label: "Leader" },
  ];

  // Add avatar selection handler with logging
  const handleAvatarSelect = (avatarId: string) => {
    console.log("Avatar selected:", avatarId);
    setSelectedAvatar(avatarId);
    
    // Optional: Save to localStorage
    if (isClient) {
      localStorage.setItem("parentAvatar", avatarId);
    }
  };

  const navItems = [
    { href: "/", icon: "fas fa-home", label: "Home" },
    { href: "/parent-dashboard", icon: "fas fa-th-large", label: "My Dashboard" },
    { href: "/rewards-store", icon: "fas fa-gift", label: "Rewards Store" },
  ];

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      // Clear session data
      if (isClient) {
        sessionStorage.removeItem("userRole");
        localStorage.removeItem("parentAvatar");
      }
      alert("Logged out!");
      router.push("/");
    }
  };

  // Show loading while checking permissions
  if (userRole === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00C2E0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Show access denied message if not parent
  if (userRole !== "parent") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-lg">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-lock text-red-500 text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            This area is for parents only. Please log in with a parent account.
          </p>
          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full bg-[#00C2E0] text-white py-3 rounded-lg hover:bg-[#00A8C2] transition font-bold text-center"
            >
              Go to Home
            </Link>
            <button
              onClick={handleLogout}
              className="block w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-bold"
            >
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            href="/settings"
            className="nav-item px-6 py-3 flex items-center gap-3.5 text-white/80 no-underline text-base hover:bg-white/5 transition-colors"
          >
            <i className="fas fa-cog"></i> Settings
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
            href="/parent-dashboard"
            className="breadcrumb flex items-center gap-2 text-[#00C2E0] font-bold no-underline text-lg"
          >
            <i className="fas fa-chevron-left"></i> Parent Profile
          </Link>
          <div className="header-actions flex items-center gap-4">
            <div className="notif-badge w-10 h-10 rounded-full border border-[#00C2E0] text-[#00C2E0] flex items-center justify-center bg-white cursor-pointer">
              <i className="far fa-bell"></i>
            </div>
            <div className="user-avatar-small w-10 h-10 rounded-full bg-[#E0F7FA] text-[#00C2E0] flex items-center justify-center font-bold border border-[#B2EBF2]">
              {/* Only render emoji on client side */}
              {isClient ? (avatars.find(a => a.id === selectedAvatar)?.emoji || "👨") : "P"}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="content-body px-10 py-8 max-w-5xl">
          <h1 className="view-title text-3xl font-black text-[#00C2E0] flex items-center gap-3 mb-1">
            <i className="fas fa-user-tie"></i> Parent Profile
          </h1>
          <p className="view-subtitle text-[#64748b] text-base mb-8">
            Manage your family account and settings.
          </p>

          {/* Tabs */}
          <div className="tabs-container bg-[#eef2f6] p-1.5 rounded-xl flex gap-1 mb-8">
            <button
              onClick={() => setActiveTab("profile")}
              className={`tab-button flex-1 py-3.5 px-4 rounded-lg text-base font-bold transition-colors ${activeTab === "profile" ? "bg-white text-[#00C2E0] shadow-sm" : "text-[#64748b] hover:text-[#00C2E0]"}`}
            >
              <i className="fas fa-user-tie mr-2.5"></i> My Profile
            </button>
            <button
              onClick={() => setActiveTab("family")}
              className={`tab-button flex-1 py-3.5 px-4 rounded-lg text-base font-bold transition-colors ${activeTab === "family" ? "bg-white text-[#00C2E0] shadow-sm" : "text-[#64748b] hover:text-[#00C2E0]"}`}
            >
              <i className="fas fa-users mr-2.5"></i> Family
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`tab-button flex-1 py-3.5 px-4 rounded-lg text-base font-bold transition-colors ${activeTab === "settings" ? "bg-white text-[#00C2E0] shadow-sm" : "text-[#64748b] hover:text-[#00C2E0]"}`}
            >
              <i className="fas fa-cog mr-2.5"></i> Settings
            </button>
          </div>

          {/* Profile Tab Content */}
          {activeTab === "profile" && (
            <div className="profile-content">
              <div className="profile-card bg-white rounded-2xl shadow-sm border border-[#e2e8f0] p-8 mb-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                  {/* Avatar Section */}
                  <div className="flex-shrink-0 text-center">
                    <div className="relative mb-6">
                      <div className="w-48 h-48 bg-gradient-to-br from-[#006372] to-[#004955] rounded-2xl flex items-center justify-center text-9xl text-white mb-4 mx-auto">
                        {/* Only render emoji on client side */}
                        {isClient ? (avatars.find(a => a.id === selectedAvatar)?.emoji || "👨‍👩‍👧‍👦") : "F"}
                      </div>
                      <button className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 transition">
                        <i className="fas fa-camera text-[#00C2E0]"></i>
                      </button>
                    </div>
                    
                    <h3 className="text-2xl font-black text-gray-800 mb-1">Family Manager</h3>
                    <p className="text-[#64748b] text-base">Parent Account</p>
                    
                    {/* Avatar Selection */}
                    <div className="mt-8">
                      <h4 className="text-lg font-bold text-gray-800 mb-4">Choose Avatar</h4>
                      <div className="flex flex-wrap gap-4 justify-center">
                        {avatars.map((avatar) => (
                          <button
                            key={avatar.id}
                            onClick={() => handleAvatarSelect(avatar.id)}
                            className={`avatar-option w-16 h-16 rounded-xl flex items-center justify-center text-3xl transition-all ${
                              selectedAvatar === avatar.id
                                ? "ring-4 ring-[#00C2E0] bg-[#E0F7FA] shadow-md"
                                : "bg-gray-100 hover:bg-gray-200 hover:scale-105"
                            }`}
                            title={avatar.label}
                          >
                            {/* Only render emoji on client side */}
                            {isClient ? avatar.emoji : avatar.label.charAt(0)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Stats Section */}
                  <div className="flex-1">
                    <h2 className="text-2xl font-black text-gray-800 mb-6">Family Overview</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {/* Family Members */}
                      <div className="stat-card bg-gradient-to-br from-[#E0F7FA] to-[#B2EBF2] p-6 rounded-xl border border-[#B2EBF2]">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-[#006372] text-sm font-medium">Family Members</p>
                            <p className="text-4xl font-black text-[#00A8C2]">4</p>
                          </div>
                          <i className="fas fa-users text-3xl text-[#00C2E0]"></i>
                        </div>
                        <Link 
                          href="/child-dashboard"
                          className="block w-full bg-[#00C2E0] text-white py-3 rounded-lg hover:bg-[#00A8C2] transition font-bold text-center"
                        >
                          Monitor Children
                        </Link>
                      </div>

                      {/* Active Tasks */}
                      <div className="stat-card bg-gradient-to-br from-[#E0F7FA] to-[#B2EBF2] p-6 rounded-xl border border-[#B2EBF2]">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-[#006372] text-sm font-medium">Active Tasks</p>
                            <p className="text-4xl font-black text-[#00A8C2]">12</p>
                          </div>
                          <i className="fas fa-tasks text-3xl text-[#00C2E0]"></i>
                        </div>
                        <Link 
                          href="/parent-dashboard"
                          className="block w-full bg-[#00C2E0] text-white py-3 rounded-lg hover:bg-[#00A8C2] transition font-bold text-center"
                        >
                          Manage Tasks
                        </Link>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-gray-800">Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <Link 
                          href="/ai-suggester"
                          className="bg-gradient-to-r from-[#00C2E0] to-[#00A8C2] text-white p-4 rounded-xl hover:opacity-90 transition text-center font-bold"
                        >
                          <i className="fas fa-lightbulb mr-2"></i>
                          AI Tasks
                        </Link>
                        <Link 
                          href="/rewards-store"
                          className="bg-gradient-to-r from-[#006372] to-[#004955] text-white p-4 rounded-xl hover:opacity-90 transition text-center font-bold"
                        >
                          <i className="fas fa-gift mr-2"></i>
                          Rewards
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Family Tab Content */}
          {activeTab === "family" && (
            <div className="family-content">
              <div className="family-card bg-white rounded-2xl shadow-sm border border-[#e2e8f0] p-8">
                <h2 className="text-2xl font-black text-gray-800 mb-6">Family Members</h2>
                
                <div className="space-y-4">
                  {[
                    { name: "Alex (Child)", role: "Task Master", points: "1,250", tasks: "47", avatar: "👦" },
                    { name: "Emma (Child)", role: "Reward Hunter", points: "980", tasks: "32", avatar: "👧" },
                    { name: "Parent Assistant", role: "Helper", points: "500", tasks: "15", avatar: "👨‍🏫" },
                  ].map((member, index) => (
                    <div key={index} className="family-member flex items-center gap-4 p-4 border border-[#e2e8f0] rounded-xl hover:bg-[#f8fafc] transition">
                      <div className="member-avatar w-16 h-16 bg-[#E0F7FA] rounded-full flex items-center justify-center text-3xl">
                        {/* Only render emoji on client side */}
                        {isClient ? member.avatar : member.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800">{member.name}</h4>
                        <p className="text-sm text-[#64748b]">{member.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#00A8C2]">{member.points} pts</p>
                        <p className="text-sm text-[#64748b]">{member.tasks} tasks</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6">
                  <button className="w-full bg-[#00C2E0] text-white py-3 rounded-lg hover:bg-[#00A8C2] transition font-bold">
                    <i className="fas fa-user-plus mr-2"></i>
                    Add Family Member
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab Content */}
          {activeTab === "settings" && (
            <div className="settings-content">
              <div className="settings-card bg-white rounded-2xl shadow-sm border border-[#e2e8f0] p-8">
                <h2 className="text-2xl font-black text-gray-800 mb-6">Settings</h2>
                
                <div className="space-y-6">
                  {/* Notifications */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Notifications</h3>
                    <div className="space-y-4">
                      {[
                        { label: "Email Notifications", state: emailNotifications, setter: setEmailNotifications, desc: "Receive task updates via email" },
                        { label: "Task Approval Required", state: taskApproval, setter: setTaskApproval, desc: "Approve tasks before assignment" },
                        { label: "AI Suggestions", state: aiSuggestions, setter: setAiSuggestions, desc: "Enable AI task suggestions" },
                      ].map((setting, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-[#e2e8f0] rounded-xl hover:bg-[#f8fafc] transition">
                          <div>
                            <h4 className="font-bold text-gray-800">{setting.label}</h4>
                            <p className="text-sm text-[#64748b]">{setting.desc}</p>
                          </div>
                          <button 
                            onClick={() => setting.setter(!setting.state)}
                            className={`w-14 h-7 rounded-full transition ${setting.state ? "bg-[#00C2E0]" : "bg-gray-300"}`}
                          >
                            <div className={`w-6 h-6 bg-white rounded-full transform transition ${setting.state ? "translate-x-8" : "translate-x-1"} mt-0.5`}></div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Account Info */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Account Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-[#e2e8f0] rounded-xl">
                        <label className="block text-sm font-medium text-[#64748b] mb-1">Full Name</label>
                        <p className="text-gray-800 font-bold">Family Manager</p>
                      </div>
                      <div className="p-4 border border-[#e2e8f0] rounded-xl">
                        <label className="block text-sm font-medium text-[#64748b] mb-1">Email</label>
                        <p className="text-gray-800 font-bold">parent@familytask.com</p>
                      </div>
                    </div>
                    
                    {/* Save Button */}
                    <div className="mt-8">
                      <button className="w-full bg-gradient-to-r from-[#006372] to-[#004955] text-white py-3 rounded-xl hover:opacity-90 transition font-bold">
                        <i className="fas fa-save mr-2"></i>
                        Save All Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

