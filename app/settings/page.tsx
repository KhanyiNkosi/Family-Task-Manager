"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: true,
    soundEffects: false,
    darkMode: false,
    language: "English",
    timezone: "UTC-5",
    dailyReminders: true,
    weeklyReports: false,
  });

  const [familyMembers, setFamilyMembers] = useState([
    { id: 1, name: "Parent", role: "admin", points: 0, active: true },
    { id: 2, name: "Sarah", role: "child", points: 1250, active: true },
    { id: 3, name: "John", role: "child", points: 850, active: true },
    { id: 4, name: "Emily", role: "child", points: 0, active: false },
  ]);

  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("child");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
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

  useEffect(() => {
    const savedImage = localStorage.getItem("parentProfileImage") || "";
    setProfileImage(savedImage);
  }, []);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage("Settings saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    }, 1000);
  };

  const handleResetPoints = async () => {
    const confirmed = await showConfirm("Are you sure you want to reset all points? This cannot be undone.");
    if (confirmed) {
      setFamilyMembers(members => 
        members.map(member => ({ ...member, points: 0 }))
      );
      showAlert("All points have been reset to zero.", "success");
    }
  };

  const handleAddFamilyMember = () => {
    if (!newMemberName.trim()) {
      showAlert("Please enter a name for the family member.", "warning");
      return;
    }

    const newMember = {
      id: familyMembers.length + 1,
      name: newMemberName.trim(),
      role: newMemberRole,
      points: 0,
      active: true,
    };

    setFamilyMembers(prev => [...prev, newMember]);
    setNewMemberName("");
    setNewMemberRole("child");
    
    showAlert(`${newMember.name} has been added to the family!`, "success");
  };

  const handleToggleMemberStatus = (id: number) => {
    setFamilyMembers(members =>
      members.map(member =>
        member.id === id 
          ? { ...member, active: !member.active }
          : member
      )
    );
  };

  const handleRemoveMember = async (id: number, name: string) => {
    const confirmed = await showConfirm(`Are you sure you want to remove ${name} from the family?`);
    if (confirmed) {
      setFamilyMembers(members => members.filter(member => member.id !== id));
    }
  };

  const handleExportData = () => {
    const exportData = {
      settings,
      familyMembers,
      exportedAt: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `familytask-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert("Data exported successfully!", "success");
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
              <Link href="/ai-suggester">
                <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition">
                  <i className="fas fa-robot mr-2"></i>
                  AI Assistant
                </button>
              </Link>
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
        {/* LOGO SECTION - ADDED AS REQUESTED */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-[#00C2E0] rounded-full relative flex justify-center items-center overflow-hidden">
              <div className="eyes absolute top-5 w-10 h-3 flex justify-between">
                <div className="w-3 h-3 bg-white rounded-full"></div>
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <div className="smile absolute bottom-4 w-8 h-4 border-b-3 border-white rounded-b-full"></div>
            </div>
            <h1 className="text-5xl font-black text-[#006372]">FamilyTask</h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Manage your family account settings and preferences
          </p>
        </div>

        {/* Original Header */}
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

              <div className="space-y-4 mb-8">
                {familyMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        member.role === "admin" ? "bg-[#00C2E0]" : "bg-purple-500"
                      } text-white font-bold`}>
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{member.name}</div>
                        <div className="text-sm text-gray-500 capitalize">
                          {member.role} • {member.points.toLocaleString()} points • 
                          <span className={`ml-1 ${member.active ? "text-green-600" : "text-gray-400"}`}>
                            {member.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleMemberStatus(member.id)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          member.active 
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200" 
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {member.active ? "Deactivate" : "Activate"}
                      </button>
                      {member.role !== "admin" && (
                        <button
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Family Member */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Add Family Member</h3>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="Enter name"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C2E0]"
                  />
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C2E0]"
                  >
                    <option value="child">Child</option>
                    <option value="parent">Parent</option>
                  </select>
                  <button
                    onClick={handleAddFamilyMember}
                    className="px-6 py-2 bg-[#00C2E0] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - App Settings */}
          <div className="space-y-8">
            {/* Display Settings */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Display Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                  <div>
                    <div className="font-medium text-gray-800">Dark Mode</div>
                    <div className="text-sm text-gray-500">Switch to dark theme</div>
                  </div>
                  <button
                    onClick={() => handleSettingChange("darkMode", !settings.darkMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.darkMode ? "bg-gray-800" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.darkMode ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="p-4 border border-gray-100 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleSettingChange("language", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C2E0]"
                  >
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>

                <div className="p-4 border border-gray-100 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleSettingChange("timezone", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C2E0]"
                  >
                    <option>UTC-5 (EST)</option>
                    <option>UTC-8 (PST)</option>
                    <option>UTC+0 (GMT)</option>
                    <option>UTC+1 (CET)</option>
                    <option>UTC+2 (EET)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Data Management */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Data Management</h2>
              
              <div className="space-y-4">
                <button
                  onClick={handleExportData}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 text-blue-700 rounded-xl font-medium hover:bg-blue-200 transition-colors"
                >
                  <i className="fas fa-download"></i>
                  Export Family Data
                </button>
                
                <button
                  onClick={() => showAlert("This would open a file picker in a real app", "info")}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-xl font-medium hover:bg-green-200 transition-colors"
                >
                  <i className="fas fa-upload"></i>
                  Import Family Data
                </button>
                
                <button
                  onClick={async () => {
                    const confirmed = await showConfirm("This will delete all your data. This action cannot be undone!");
                    if (confirmed) {
                      showAlert("Data deletion would happen here in a real app", "info");
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition-colors"
                >
                  <i className="fas fa-trash"></i>
                  Delete All Data
                </button>
              </div>
            </div>

            {/* Save Settings */}
            <div className="bg-gradient-to-r from-cyan-500 to-teal-500 rounded-2xl shadow-xl p-6 text-white">
              <h2 className="text-2xl font-bold mb-4">Save Changes</h2>
              <p className="mb-6 opacity-90">Your settings are automatically saved, but you can manually save them here.</p>
              
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-[#006372] rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Save All Settings
                  </>
                )}
              </button>
              
              {saveMessage && (
                <div className="mt-4 p-3 bg-white/20 rounded-lg text-center animate-pulse">
                  <i className="fas fa-check-circle mr-2"></i>
                  {saveMessage}
                </div>
              )}
            </div>

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
                  <span className="font-medium">{familyMembers.filter(m => m.active).length} active</span>
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

