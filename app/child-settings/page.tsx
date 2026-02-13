"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from '@/lib/supabaseClient';

export default function ChildSettingsPage() {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState("");
  const [childAvatar, setChildAvatar] = useState("");
  const [childName, setChildName] = useState("Child");
  
  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [celebrationAnimations, setCelebrationAnimations] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);

  // Modal states
  const [alertModal, setAlertModal] = useState<{ show: boolean; message: string; type: "success" | "error" | "warning" | "info" }>({ 
    show: false, message: "", type: "info" 
  });
  const [confirmModal, setConfirmModal] = useState<{ 
    show: boolean; 
    message: string; 
    onConfirm: () => void 
  }>({ 
    show: false, 
    message: "", 
    onConfirm: () => {} 
  });

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
    const loadSettings = async () => {
      // Load profile image and avatar (per user)
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      const imageKey = user ? `childProfileImage:${user.id}` : "childProfileImage";
      const avatarKey = user ? `childAvatar:${user.id}` : "childAvatar";
      const savedImage = localStorage.getItem(imageKey) || "";
      const savedAvatar = localStorage.getItem(avatarKey) || "";
      setProfileImage(savedImage);
      setChildAvatar(savedAvatar);

      // Load settings from localStorage
      const savedNotifications = localStorage.getItem("childNotifications");
      const savedSoundEffects = localStorage.getItem("childSoundEffects");
      const savedTaskReminders = localStorage.getItem("childTaskReminders");
      const savedCelebrations = localStorage.getItem("childCelebrations");

      if (savedNotifications !== null) setNotifications(savedNotifications === "true");
      if (savedSoundEffects !== null) setSoundEffects(savedSoundEffects === "true");
      if (savedTaskReminders !== null) setTaskReminders(savedTaskReminders === "true");
      if (savedCelebrations !== null) setCelebrationAnimations(savedCelebrations === "true");

      // Load user name from Supabase
      try {
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();
          
          if (profile?.full_name) {
            setChildName(profile.full_name);
            setDisplayName(profile.full_name);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadSettings();
  }, []);

  const handleToggleSetting = (setting: string, value: boolean) => {
    switch (setting) {
      case 'notifications':
        setNotifications(value);
        localStorage.setItem('childNotifications', value.toString());
        break;
      case 'soundEffects':
        setSoundEffects(value);
        localStorage.setItem('childSoundEffects', value.toString());
        break;
      case 'taskReminders':
        setTaskReminders(value);
        localStorage.setItem('childTaskReminders', value.toString());
        break;
      case 'celebrations':
        setCelebrationAnimations(value);
        localStorage.setItem('childCelebrations', value.toString());
        break;
    }
    showAlert(`${setting.replace(/([A-Z])/g, ' $1')} ${value ? 'enabled' : 'disabled'}!`, "success");
  };

  const handleUpdateName = async () => {
    if (!displayName.trim()) {
      showAlert("Name cannot be empty!", "error");
      return;
    }

    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showAlert("You must be logged in to update your name", "error");
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: displayName.trim() })
        .eq('id', user.id);

      if (error) throw error;

      setChildName(displayName.trim());
      setIsEditingName(false);
      showAlert("Display name updated successfully!", "success");
    } catch (error) {
      console.error('Error updating name:', error);
      showAlert("Failed to update display name", "error");
    }
  };

  const handleClearData = async () => {
    const confirmed = await showConfirm(
      "Are you sure you want to clear all your local data? This will remove:\n\n• Saved goals\n• Activity history\n• Local preferences\n\nThis cannot be undone!"
    );
    
    if (confirmed) {
      localStorage.removeItem('childGoals');
      localStorage.removeItem('childActivities');
      localStorage.removeItem('childAvatar');
      showAlert("Local data cleared successfully!", "success");
      setTimeout(() => router.push('/child-dashboard'), 1500);
    }
  };

  const avatarMap: { [key: string]: string } = {
    avatar1: "👦",
    avatar2: "👧",
    avatar3: "🤖",
    avatar4: "🦸",
    avatar5: "🧑‍🚀",
    avatar6: "👽",
    avatar7: "🥷",
    avatar8: "🧙",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/child-dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
                <i className="fas fa-arrow-left text-xl"></i>
                <span className="hidden md:inline">Back to Dashboard</span>
              </Link>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <i className="fas fa-cog"></i>
                  My Settings
                </h1>
                <p className="text-white/80 mt-1">Manage your preferences and account</p>
              </div>
            </div>
            <Link 
              href="/child-profile"
              className="flex items-center justify-center w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full transition-all overflow-hidden border-2 border-white/30"
              title="My Profile"
            >
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : childAvatar && avatarMap[childAvatar] ? (
                <span className="text-2xl">{avatarMap[childAvatar]}</span>
              ) : (
                <i className="fas fa-user text-xl"></i>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        {/* PROFILE SECTION */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-[#006372] mb-4 flex items-center gap-2">
            <i className="fas fa-user-circle"></i>
            Profile Settings
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={!isEditingName}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter your name"
                />
                {isEditingName ? (
                  <>
                    <button
                      onClick={handleUpdateName}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                    >
                      <i className="fas fa-check mr-2"></i>Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingName(false);
                        setDisplayName(childName);
                      }}
                      className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="px-6 py-3 bg-[#00C2E0] text-white rounded-lg hover:bg-[#00A8C2] transition font-medium"
                  >
                    <i className="fas fa-edit mr-2"></i>Edit
                  </button>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Link 
                href="/child-profile"
                className="inline-flex items-center gap-2 text-[#00C2E0] hover:text-[#00A8C2] font-medium"
              >
                <i className="fas fa-camera"></i>
                Change Profile Picture
                <i className="fas fa-arrow-right text-sm"></i>
              </Link>
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS SECTION */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-[#006372] mb-4 flex items-center gap-2">
            <i className="fas fa-bell"></i>
            Notifications & Alerts
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">Push Notifications</h3>
                <p className="text-sm text-gray-600">Get notified about new tasks and rewards</p>
              </div>
              <button
                onClick={() => handleToggleSetting('notifications', !notifications)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  notifications ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    notifications ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">Task Reminders</h3>
                <p className="text-sm text-gray-600">Remind me about pending tasks</p>
              </div>
              <button
                onClick={() => handleToggleSetting('taskReminders', !taskReminders)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  taskReminders ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    taskReminders ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* PREFERENCES SECTION */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-[#006372] mb-4 flex items-center gap-2">
            <i className="fas fa-sliders-h"></i>
            Preferences
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">Sound Effects</h3>
                <p className="text-sm text-gray-600">Play sounds when completing tasks</p>
              </div>
              <button
                onClick={() => handleToggleSetting('soundEffects', !soundEffects)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  soundEffects ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    soundEffects ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">Celebration Animations</h3>
                <p className="text-sm text-gray-600">Show fun animations when you level up</p>
              </div>
              <button
                onClick={() => handleToggleSetting('celebrations', !celebrationAnimations)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  celebrationAnimations ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    celebrationAnimations ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* QUICK LINKS */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-[#006372] mb-4 flex items-center gap-2">
            <i className="fas fa-link"></i>
            Quick Links
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/child-dashboard"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition border border-blue-200"
            >
              <i className="fas fa-th-large text-2xl text-blue-600"></i>
              <div>
                <h3 className="font-bold text-gray-800">My Dashboard</h3>
                <p className="text-sm text-gray-600">View your tasks</p>
              </div>
            </Link>

            <Link
              href="/my-rewards"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg hover:shadow-md transition border border-purple-200"
            >
              <i className="fas fa-gift text-2xl text-purple-600"></i>
              <div>
                <h3 className="font-bold text-gray-800">My Rewards</h3>
                <p className="text-sm text-gray-600">Redeem your points</p>
              </div>
            </Link>

            <Link
              href="/my-goals"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg hover:shadow-md transition border border-green-200"
            >
              <i className="fas fa-bullseye text-2xl text-green-600"></i>
              <div>
                <h3 className="font-bold text-gray-800">My Goals</h3>
                <p className="text-sm text-gray-600">Track your progress</p>
              </div>
            </Link>

            <Link
              href="/child-profile"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-lg hover:shadow-md transition border border-cyan-200"
            >
              <i className="fas fa-user text-2xl text-cyan-600"></i>
              <div>
                <h3 className="font-bold text-gray-800">My Profile</h3>
                <p className="text-sm text-gray-600">View your stats</p>
              </div>
            </Link>
          </div>
        </div>

        {/* DATA & PRIVACY */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-[#006372] mb-4 flex items-center gap-2">
            <i className="fas fa-shield-alt"></i>
            Data & Privacy
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-gray-800 mb-2">Clear Local Data</h3>
              <p className="text-sm text-gray-600 mb-4">
                Remove all locally stored data including goals and activity history. This won't affect your tasks or rewards.
              </p>
              <button
                onClick={handleClearData}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-bold"
              >
                <i className="fas fa-trash-alt mr-2"></i>
                Clear Local Data
              </button>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <i className="fas fa-info-circle text-2xl text-blue-600 mt-1"></i>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Your Privacy Matters</h3>
                  <p className="text-sm text-gray-600">
                    Your data is stored securely and is only visible to your family members. We never share your information with third parties.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ALERT MODAL */}
      {alertModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scaleIn">
            <div className="text-center">
              {alertModal.type === "success" && (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-check-circle text-3xl text-green-600"></i>
                </div>
              )}
              {alertModal.type === "error" && (
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-times-circle text-3xl text-red-600"></i>
                </div>
              )}
              {alertModal.type === "warning" && (
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-exclamation-triangle text-3xl text-amber-600"></i>
                </div>
              )}
              {alertModal.type === "info" && (
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-info-circle text-3xl text-blue-600"></i>
                </div>
              )}
              <p className="text-lg text-gray-800 mb-6 whitespace-pre-line">{alertModal.message}</p>
              <button
                onClick={() => setAlertModal({ ...alertModal, show: false })}
                className="px-6 py-3 bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white rounded-xl font-bold hover:shadow-lg transition-all w-full"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scaleIn">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-3xl text-amber-600"></i>
            </div>
            <h3 className="text-xl font-bold text-center mb-4 text-gray-800">Confirm Action</h3>
            <p className="text-gray-700 text-center mb-6 whitespace-pre-line">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirmModal({ show: false, message: "", onConfirm: () => {} });
                  if ((window as any)._confirmCancelHandler) {
                    (window as any)._confirmCancelHandler();
                  }
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white rounded-xl font-bold hover:shadow-lg transition"
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
