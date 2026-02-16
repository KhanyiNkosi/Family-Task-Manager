"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from '@/lib/supabaseClient';

export default function ChildProfilePage() {
  const [activeTab, setActiveTab] = useState<"profile" | "activity">("profile");
  const [profileImage, setProfileImage] = useState("");
  const [tempImage, setTempImage] = useState("");
  const [profileStorageKey, setProfileStorageKey] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [childName, setChildName] = useState("Child");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [level, setLevel] = useState(1);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Modal states
  const [alertModal, setAlertModal] = useState<{ show: boolean; message: string; type: "success" | "error" | "warning" | "info" }>({ show: false, message: "", type: "info" });
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; message: string; onConfirm: () => void }>({ show: false, message: "", onConfirm: () => {} });

  // Modal helper functions
  const showAlert = (message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    setAlertModal({ show: true, message, type });
  };

  const showConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmModal({
        show: true,
        message,
        onConfirm: () => {
          setConfirmModal({ show: false, message: "", onConfirm: () => {} });
          resolve(true);
        },
      });
      setTimeout(() => {
        (window as any)._confirmCancelHandler = () => resolve(false);
      }, 0);
    });
  };

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const supabase = createClientSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log('No user found');
          setIsClient(true);
          return;
        }

        const storageKey = `childProfileImage:${user.id}`;
        setProfileStorageKey(storageKey);
        const savedImage = localStorage.getItem(storageKey) || "";
        setProfileImage(savedImage);
        
        // Load profile data from Supabase
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (profile?.full_name) {
          setChildName(profile.full_name);
        }
        
        // Calculate points from completed/approved tasks
        const { data: allTasks } = await supabase
          .from('tasks')
          .select('points, completed, approved')
          .eq('assigned_to', user.id);
        
        const earnedPoints = allTasks?.reduce((total: number, task: any) => {
          // Count points for approved tasks (approval is when points are awarded)
          if (task.approved) {
            return total + (task.points || 0);
          }
          return total;
        }, 0) || 0;
        
        // Subtract points spent on APPROVED reward redemptions only
        const { data: allRedemptions } = await supabase
          .from('reward_redemptions')
          .select('points_spent')
          .eq('user_id', user.id)
          .eq('status', 'approved');
        
        const spentPoints = allRedemptions?.reduce((total: number, redemption: any) => {
          return total + (redemption.points_spent || 0);
        }, 0) || 0;
        
        const currentPoints = earnedPoints - spentPoints;
        setTotalPoints(currentPoints);
        
        // Calculate level (100 points per level)
        const calculatedLevel = Math.floor(currentPoints / 100) + 1;
        setLevel(calculatedLevel);
        
        // Load tasks completed count and recent activities
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, title, points, completed, approved, completed_at')
          .eq('assigned_to', user.id)
          .order('completed_at', { ascending: false, nullsFirst: false });
        
        const completed = tasks?.filter((t: any) => t.approved).length || 0;
        setTasksCompleted(completed);
        
        // Load reward redemptions
        const { data: redemptions } = await supabase
          .from('reward_redemptions')
          .select(`
            id,
            points_spent,
            redeemed_at,
            status,
            reward:rewards(title)
          `)
          .eq('user_id', user.id)
          .order('redeemed_at', { ascending: false });
        
        // Combine tasks and redemptions into activity feed
        const activities: any[] = [];
        
        // Add approved tasks to activity feed
        tasks?.forEach((task: any) => {
          if (task.approved) {
            activities.push({
              title: `Task Approved: ${task.title}`,
              time: task.completed_at ? new Date(task.completed_at).toLocaleDateString() : 'Recently',
              points: task.points || 0,
              icon: 'fa-check-circle',
              color: 'text-green-600',
              timestamp: task.completed_at || new Date()
            });
          }
        });
        
        // Add reward redemptions
        redemptions?.forEach((redemption: any) => {
          activities.push({
            title: `Redeemed: ${redemption.reward?.title || 'Reward'}`,
            time: new Date(redemption.redeemed_at).toLocaleDateString(),
            points: -(redemption.points_spent || 0),
            icon: 'fa-gift',
            color: redemption.status === 'approved' ? 'text-blue-600' : 'text-orange-600',
            timestamp: redemption.redeemed_at
          });
        });
        
        // Sort by timestamp and take top 5
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentActivities(activities.slice(0, 5));
        
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
      
      setIsClient(true);
    };
    
    loadProfileData();
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
    const storageKey = profileStorageKey || "childProfileImage";
    localStorage.setItem(storageKey, tempImage);
    setIsEditing(false);
    showAlert("Profile picture saved!", "success");
  };

  const handleCancel = () => {
    setTempImage("");
    setIsEditing(false);
  };

  const handleRemove = () => {
    setProfileImage("");
    const storageKey = profileStorageKey || "childProfileImage";
    localStorage.removeItem(storageKey);
    showAlert("Profile picture removed!", "success");
  };

  const navItems = [
    { href: "/", icon: "fas fa-home", label: "Home" },
    { href: "/child-dashboard", icon: "fas fa-th-large", label: "My Dashboard" },
    { href: "/my-rewards", icon: "fas fa-gift", label: "My Rewards" },
    { href: "/my-goals", icon: "fas fa-bullseye", label: "My Goals" },
    { href: "/child-profile", icon: "fas fa-user", label: "My Profile" },
  ];

  const handleLogout = async () => {
    const confirmed = await showConfirm("Are you sure you want to logout?");
    if (confirmed) {
      try {
        const supabase = createClientSupabaseClient();
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          showAlert("Error logging out. Please try again.", "error");
          console.error('Logout error:', error);
          return;
        }
        
        // Clear any cached data
        localStorage.removeItem(profileStorageKey);
        
        showAlert("Successfully logged out!", "success");
        setTimeout(() => router.push("/"), 1000);
      } catch (error) {
        console.error('Logout error:', error);
        showAlert("Error logging out. Please try again.", "error");
      }
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Matching /profile design */}
      <aside className="sidebar hidden lg:flex w-64 bg-[#006372] text-white flex-col py-6">
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
            href="/child-settings"
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
        <div className="lg:ml-0 flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Mobile Hamburger Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
              <div className="w-64 h-full bg-[#006372] text-white p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3 text-2xl font-extrabold">
                    <i className="far fa-smile-beam text-3xl"></i>
                    <span>FamilyTask</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-2xl">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <nav className="space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3.5 px-4 py-3 rounded-lg transition-all text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      <i className={`${item.icon} w-5 text-center`}></i>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto pt-6 border-t border-white/10 space-y-3 absolute bottom-6 left-6 right-6">
                  <Link
                    href="/child-settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white/90 rounded-xl hover:bg-white/20 transition-all font-medium"
                  >
                    <i className="fas fa-cog"></i>
                    My Settings
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 text-red-100 rounded-xl hover:bg-red-500/30 transition-all font-medium border border-red-400/30"
                  >
                    <i className="fas fa-sign-out-alt"></i>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Mobile Header */}
          <div className="lg:hidden mb-4 bg-gradient-to-r from-[#006372] to-[#004955] text-white px-4 py-3 rounded-xl flex items-center justify-between">
            <button onClick={() => setMobileMenuOpen(true)} className="text-2xl">
              <i className="fas fa-bars"></i>
            </button>
            <div className="flex items-center gap-3">
              <i className="fas fa-smile text-2xl"></i>
              <span className="font-bold text-lg">FamilyTask</span>
            </div>
            <button 
              onClick={handleLogout}
              className="px-3 py-1 bg-white/20 rounded-lg text-sm"
            >
              Logout
            </button>
          </div>
          
          {/* Header */}
          <header className="mb-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#006372]">My Profile</h1>
                <p className="text-gray-600 mt-2">Manage your profile picture and view your progress</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 flex items-center justify-center">
                    {isClient && profileImage ? (
                      <img 
                        src={profileImage} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <i className="fas fa-child text-white text-sm"></i>
                    )}
                  </div>
                  <span className="font-medium text-gray-700">Child Account</span>
                </div>
                <Link href="/child-settings">
                  <button className="p-3 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                    <i className="fas fa-cog text-gray-600"></i>
                  </button>
                </Link>
              </div>
            </div>
          </header>

          {/* Content Body */}
          <div>

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
                    
                    <h3 className="text-2xl font-black text-gray-800 mb-1">{childName}</h3>
                    <p className="text-[#64748b] text-base mb-6">Level {level} • Family Member</p>
                    
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
                            <p className="text-4xl font-black text-[#00A8C2]">{totalPoints}</p>
                          </div>
                          <i className="fas fa-star text-3xl text-yellow-500"></i>
                        </div>
                        <Link href="/my-rewards" className="block w-full bg-[#00C2E0] text-white py-3 rounded-lg hover:bg-[#00A8C2] transition font-bold text-center">
                          My Rewards
                        </Link>
                      </div>

                      <div className="stat-card bg-gradient-to-br from-[#E0F7FA] to-[#B2EBF2] p-6 rounded-xl border border-[#B2EBF2]">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-[#006372] text-sm font-medium">Tasks Done</p>
                            <p className="text-4xl font-black text-[#00A8C2]">{tasksCompleted}</p>
                          </div>
                          <i className="fas fa-check-circle text-3xl text-[#00C2E0]"></i>
                        </div>
                        <Link href="/child-dashboard" className="block w-full bg-[#00C2E0] text-white py-3 rounded-lg hover:bg-[#00A8C2] transition font-bold text-center">
                          View Tasks
                        </Link>
                      </div>

                      <div className="stat-card bg-gradient-to-br from-[#E0F7FA] to-[#B2EBF2] p-6 rounded-xl border border-[#B2EBF2] md:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-[#006372] text-sm font-medium">Level</p>
                            <p className="text-4xl font-black text-[#00A8C2]">{level}</p>
                          </div>
                          <i className="fas fa-trophy text-3xl text-[#00C2E0]"></i>
                        </div>
                        <div className="mb-4">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-gradient-to-r from-[#00C2E0] to-[#00A8C2] h-3 rounded-full" 
                              style={{ width: `${(totalPoints % 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-[#64748b] mt-2">{totalPoints % 100}/100 points to level {level + 1}</p>
                        </div>
                        <Link href="/child-dashboard" className="block w-full bg-[#00C2E0] text-white py-3 rounded-lg hover:bg-[#00A8C2] transition font-bold text-center">
                          Keep Going!
                        </Link>
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
                  {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
                    <div key={index} className="activity-item flex items-center gap-4 p-4 border border-[#e2e8f0] rounded-xl hover:bg-[#f8fafc] transition">
                      <div className={`activity-icon w-12 h-12 bg-[#E0F7FA] rounded-full flex items-center justify-center ${activity.color}`}>
                        <i className={`fas ${activity.icon}`}></i>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800">{activity.title}</h4>
                        <p className="text-sm text-[#64748b]">{activity.time}</p>
                      </div>
                      <span className={`font-black text-lg ${activity.points >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {activity.points >= 0 ? '+' : ''}{activity.points}
                      </span>
                    </div>
                  )) : (
                    <div className="text-center py-12">
                      <i className="fas fa-history text-6xl text-gray-300 mb-4"></i>
                      <p className="text-gray-500 text-lg">No recent activity</p>
                      <p className="text-gray-400 text-sm mt-2">Complete tasks to see your activity here!</p>
                      <Link href="/child-dashboard" className="inline-block mt-4 px-6 py-3 bg-[#00C2E0] text-white rounded-lg hover:bg-[#00A8C2] transition font-bold">
                        Go to Dashboard
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </main>

      {/* Alert Modal */}
      {alertModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn" onClick={() => setAlertModal({ ...alertModal, show: false })}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
              alertModal.type === "success" ? "bg-green-100" :
              alertModal.type === "error" ? "bg-red-100" :
              alertModal.type === "warning" ? "bg-yellow-100" :
              "bg-blue-100"
            }`}>
              <span className="text-3xl">{
                alertModal.type === "success" ? "✓" :
                alertModal.type === "error" ? "✕" :
                alertModal.type === "warning" ? "⚠" :
                "ℹ"
              }</span>
            </div>
            <h3 className={`text-xl font-bold text-center mb-2 ${
              alertModal.type === "success" ? "text-green-600" :
              alertModal.type === "error" ? "text-red-600" :
              alertModal.type === "warning" ? "text-yellow-600" :
              "text-blue-600"
            }`}>
              {alertModal.type === "success" ? "Success!" :
               alertModal.type === "error" ? "Error" :
               alertModal.type === "warning" ? "Warning" :
               "Information"}
            </h3>
            <p className="text-gray-700 text-center mb-6">{alertModal.message}</p>
            <button
              onClick={() => setAlertModal({ ...alertModal, show: false })}
              className={`w-full py-3 rounded-xl font-bold text-white transition ${
                alertModal.type === "success" ? "bg-green-500 hover:bg-green-600" :
                alertModal.type === "error" ? "bg-red-500 hover:bg-red-600" :
                alertModal.type === "warning" ? "bg-yellow-500 hover:bg-yellow-600" :
                "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scaleIn">
            <div className="w-16 h-16 rounded-full bg-yellow-100 mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl">?</span>
            </div>
            <h3 className="text-xl font-bold text-center mb-2 text-gray-800">Confirm Action</h3>
            <p className="text-gray-700 text-center mb-6">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirmModal({ show: false, message: "", onConfirm: () => {} });
                  if ((window as any)._confirmCancelHandler) {
                    (window as any)._confirmCancelHandler();
                  }
                }}
                className="flex-1 py-3 rounded-xl font-bold bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white hover:opacity-90 transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}












