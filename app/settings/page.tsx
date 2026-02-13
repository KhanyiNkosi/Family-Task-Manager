"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const [userRole, setUserRole] = useState<string>("");
  const router = useRouter();
  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: true,
    soundEffects: false,
    dailyReminders: true,
    weeklyReports: false,
  });

  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [familyCode, setFamilyCode] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [profileImage, setProfileImage] = useState("");

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

  // Load settings from Supabase
  useEffect(() => {
    async function loadSettings() {
      const supabase = require("@/app/lib/supabase").supabase;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (settingsData) {
        setSettings({
          notifications: settingsData.notifications,
          emailUpdates: settingsData.email_updates,
          soundEffects: settingsData.sound_effects,
          dailyReminders: settingsData.daily_reminders,
          weeklyReports: settingsData.weekly_reports,
        });
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    async function loadUserRole() {
      const supabase = require("@/app/lib/supabase").supabase;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      setUserRole(profile?.role || "");
    }

    async function loadProfileImage() {
      const supabase = require("@/app/lib/supabase").supabase;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const storageKey = `parentProfileImage:${user.id}`;
        const savedImage = localStorage.getItem(storageKey) || "";
        setProfileImage(savedImage);
      } else {
        setProfileImage("");
      }
    }

    // Load family members from Supabase
    async function loadFamilyMembers() {
      try {
        // Get current user
        const supabase = require("@/app/lib/supabase").supabase;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No user found');
          return;
        }
        
        setCurrentUserId(user.id);
        
        // Get user's family_id from profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('family_id, role')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          console.error('Profile error:', profileError);
          return;
        }
        
        if (!profile?.family_id) {
          console.log('No family_id found in profile');
          return;
        }
        
        // Use family_id as the family code (it's the same thing)
        setFamilyCode(profile.family_id || '');
        
        // Load all profiles in the family with calculated points from tasks
        const { data: members, error: membersError } = await supabase
          .from('profiles')
          .select(`
            id, 
            full_name, 
            role
          `)
          .eq('family_id', profile.family_id);
          
        if (membersError) {
          console.error('Members error:', membersError);
          return;
        }
        
        // Calculate points for each member from tasks
        if (members && members.length > 0) {
          const membersWithPoints = await Promise.all(
            members.map(async (member: any) => {
              const { data: tasks } = await supabase
                .from('tasks')
                .select('points, completed, approved')
                .eq('assigned_to', member.id);
              
              const earnedPoints = tasks?.reduce((total: number, task: any) => {
                // Count points for approved tasks (approval is when points are awarded)
                if (task.approved) {
                  return total + (task.points || 0);
                }
                return total;
              }, 0) || 0;
              
              // Subtract points spent on APPROVED reward redemptions only
              const { data: redemptions } = await supabase
                .from('reward_redemptions')
                .select('points_spent')
                .eq('user_id', member.id)
                .eq('status', 'approved');
              
              const spentPoints = redemptions?.reduce((total: number, redemption: any) => {
                return total + (redemption.points_spent || 0);
              }, 0) || 0;
              
              const points = earnedPoints - spentPoints;
              
              return { ...member, points };
            })
          );
          
          console.log('Loaded family members with points:', membersWithPoints);
          setFamilyMembers(membersWithPoints || []);
        } else {
          console.log('No members found');
          setFamilyMembers([]);
        }
      } catch (error) {
        console.error('Error loading family members:', error);
      }
    }
    loadUserRole();
    loadProfileImage();
    loadFamilyMembers();
  }, []);

  const handleSettingChange = async (key: string, value: any) => {
    // Update local state
    const newSettings = {
      ...settings,
      [key]: value
    };
    setSettings(newSettings);
    
    // Save to Supabase immediately with the new value
    try {
      const supabase = require("@/app/lib/supabase").supabase;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Map frontend keys to database columns
      const dbColumnMap: { [k: string]: string } = {
        'notifications': 'notifications',
        'emailUpdates': 'email_updates',
        'soundEffects': 'sound_effects',
        'dailyReminders': 'daily_reminders',
        'weeklyReports': 'weekly_reports',
      };
      
      // Build update object with proper column names
      const updatedSettings: { [k: string]: any } = {
        user_id: user.id,
      };
      
      // Add all current settings with proper column names
      Object.keys(newSettings).forEach(k => {
        const dbColumn = dbColumnMap[k] || k;
        updatedSettings[dbColumn] = newSettings[k as keyof typeof settings];
      });
      
      const { error } = await supabase
        .from('user_settings')
        .upsert(updatedSettings, { onConflict: 'user_id' });
        
      if (error) {
        showAlert('Failed to save settings: ' + error.message, 'error');
        console.error('Settings save error:', error);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showAlert('Failed to save settings', 'error');
    }
  };

  const handleResetPoints = async () => {
    const confirmed = await showConfirm("Are you sure you want to reset all family members' points? This will mark all completed/approved tasks as incomplete.");
    if (!confirmed) return;
    
    const doubleConfirm = await showConfirm("This cannot be undone! All task progress will be lost. Continue?");
    if (!doubleConfirm) return;
    
    try {
      const supabase = require("@/app/lib/supabase").supabase;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Get user's family_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user.id)
        .single();
        
      if (!profile?.family_id) return;
      
      // Reset all tasks for the family (mark as not completed/approved)
      const { error } = await supabase
        .from('tasks')
        .update({ 
          completed: false, 
          approved: false,
          completed_at: null
        })
        .eq('family_id', profile.family_id);
        
      if (error) {
        showAlert("Failed to reset points: " + error.message, "error");
      } else {
        showAlert("All family points have been reset!", "success");
        // Reload members to show updated points
        window.location.reload();
      }
    } catch (error) {
      console.error('Reset points error:', error);
      showAlert("Failed to reset points", "error");
    }
  };

  const handleRemoveMember = async (id: string, name: string) => {
    const confirmed = await showConfirm(`Are you sure you want to remove ${name} from the family?`);
    if (confirmed) {
      const supabase = require("@/app/lib/supabase").supabase;
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      if (error) {
        showAlert("Failed to remove member: " + error.message, "error");
      } else {
        showAlert(`${name} removed from the family!`, "success");
        // Reload page to refresh members list
        window.location.reload();
      }
    }
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* AI SUGGESTER HEADER - MOVED TO SETTINGS PAGE AS REQUESTED */}
      <header className="bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* FAMILYTASK LOGO */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <i className="fas fa-smile text-2xl"></i>
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold">FamilyTask</h1>
                  <p className="text-white/80 text-sm">Settings</p>
                </div>
              </Link>
            </div>

            {/* NAVIGATION */}
            <div className="flex items-center gap-4">
              <Link href="/parent-dashboard">
                <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition">
                  <i className="fas fa-chart-bar mr-2"></i>
                  Dashboard
                </button>
              </Link>
              {/* AI Assistant temporarily disabled - coming soon */}
              <Link 
                href="/parent-profile"
                className="flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full transition-all overflow-hidden"
                title="My Profile"
              >
                {profileImage ? (
                  <img src={profileImage} alt="Parent Profile" className="w-full h-full object-cover" />
                ) : (
                  <i className="fas fa-user text-lg"></i>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-[#006372]">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your family account and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Account Settings */}
          <div className="lg:col-span-2 space-y-8">
            {/* Notification Settings */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Notification Settings</h2>
              
              <div className="space-y-4">
                {[
                  { key: "notifications", label: "Push Notifications", description: "Receive notifications for task updates" },
                  { key: "emailUpdates", label: "Email Updates", description: "Get weekly summary emails" },
                  { key: "soundEffects", label: "Sound Effects", description: "Play sounds for completed tasks" },
                  { key: "dailyReminders", label: "Daily Reminders", description: "Send daily task reminders" },
                  { key: "weeklyReports", label: "Weekly Reports", description: "Email weekly progress reports" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                    <div>
                      <div className="font-medium text-gray-800">{item.label}</div>
                      <div className="text-sm text-gray-500">{item.description}</div>
                    </div>
                    <button
                      onClick={() => handleSettingChange(item.key, !settings[item.key as keyof typeof settings])}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings[item.key as keyof typeof settings] ? "bg-[#00C2E0]" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings[item.key as keyof typeof settings] ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Family Management */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Family Management</h2>
                <button
                  onClick={handleResetPoints}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
                >
                  Reset All Points
                </button>
              </div>

              <div className="space-y-4">
                {familyMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <i className="fas fa-users text-4xl mb-4 opacity-30"></i>
                    <p className="font-medium mb-2">No family members loaded</p>
                    <p className="text-sm">Check the browser console for errors, or try refreshing the page.</p>
                  </div>
                ) : (
                  familyMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          member.role === "parent" ? "bg-[#00C2E0]" : "bg-purple-500"
                        } text-white font-bold`}>
                          {member.full_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{member.full_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500 capitalize">
                            {member.role || 'No role'} • {member.points || 0} points
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {member.role !== "parent" && member.id !== currentUserId && (
                          <button
                            onClick={() => handleRemoveMember(member.id, member.full_name)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <i className="fas fa-info-circle text-blue-600 mt-1"></i>
                  <div>
                    <p className="text-sm font-medium text-blue-900">How to add family members</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Share your <strong>Family Code</strong> (shown on the right) with family members. 
                      They can enter this code when creating their account to join your family.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - App Settings */}
          <div className="space-y-8">

            {/* Family Code */}
            {familyCode ? (
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl p-6 text-white">
                <h2 className="text-2xl font-bold mb-4">Family Code</h2>
                <p className="mb-4 opacity-90">Share this code with family members to join</p>
                
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-lg font-mono font-bold mb-2 break-all">{familyCode}</div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(familyCode);
                      showAlert("Family code copied to clipboard!", "success");
                    }}
                    className="text-sm opacity-90 hover:opacity-100 transition"
                  >
                    <i className="fas fa-copy mr-2"></i>
                    Click to copy
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-2xl shadow-xl p-6 text-gray-600">
                <h2 className="text-2xl font-bold mb-4">Family Code</h2>
                <p className="mb-4">Loading family code...</p>
                <p className="text-sm">If this doesn't load, check the browser console for errors.</p>
              </div>
            )}

            {/* App Info */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">About FamilyTask</h2>
              <div className="space-y-3 text-gray-600">
                <div className="flex justify-between">
                  <span>Version</span>
                  <span className="font-medium">2.1.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated</span>
                  <span className="font-medium">Jan 19, 2026</span>
                </div>
                <div className="flex justify-between">
                  <span>Family Members</span>
                  <span className="font-medium">{familyMembers.length}</span>
                </div>
                <div className="pt-4 border-t">
                  <button
                    onClick={() => router.push("/about")}
                    className="text-[#00C2E0] hover:underline font-medium"
                  >
                    <i className="fas fa-info-circle mr-2"></i>
                    Learn more about FamilyTask
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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

