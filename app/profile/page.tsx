"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"account" | "avatar">("avatar");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [avatarInitial, setAvatarInitial] = useState("C");
  const [avatarColor, setAvatarColor] = useState("#D1F7FF");

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

  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: "/", icon: "fas fa-home", label: "Home" },
    { href: "/dashboard", icon: "fas fa-th-large", label: "My Dashboard" },
    { href: "/rewards-store", icon: "fas fa-gift", label: "Rewards Store" },
  ];

  const footerItems = [
    { href: "/settings", icon: "fas fa-cog", label: "Settings" },
    { href: "/logout", icon: "fas fa-sign-out-alt", label: "Logout" },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showAlert("File size should be less than 5MB", "warning");
        return;
      }
      if (!file.type.startsWith("image/")) {
        showAlert("Please upload an image file", "warning");
        return;
      }
      setUploadedFile(file);
      showAlert(`File "${file.name}" selected! (In a real app, this would upload to server)`, "success");
    }
  };

  const handleGenerateAvatar = () => {
    if (!aiPrompt.trim()) {
      showAlert("Please enter an AI prompt", "warning");
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const prompts = [
        "Generate a cartoon avatar with glasses and a big smile",
        "Create a superhero avatar with cape and mask",
        "Design a friendly robot avatar with glowing eyes",
        "Make a cute animal avatar with big ears"
      ];
      
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      showAlert(`AI Generated Avatar based on: "${randomPrompt}"\n\n(In a real app, this would show the generated avatar)`, "success");
      
      // Change avatar initial and color for demo
      const initials = ["A", "B", "D", "E", "F", "G"];
      const colors = ["#FFD1DC", "#D1FFE6", "#D1E6FF", "#FFE6D1", "#E6D1FF"];
      
      setAvatarInitial(initials[Math.floor(Math.random() * initials.length)]);
      setAvatarColor(colors[Math.floor(Math.random() * colors.length)]);
      setIsGenerating(false);
    }, 1500);
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm("Are you sure you want to logout?");
    if (confirmed) {
      showAlert("Logged out! (In a real app, this would clear session)", "info");
      setTimeout(() => router.push("/"), 1500);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
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
            <i className="fas fa-chevron-left"></i> My Profile
          </Link>
          <div className="header-actions flex items-center gap-4">
            <div className="notif-badge w-10 h-10 rounded-full border border-[#00C2E0] text-[#00C2E0] flex items-center justify-center bg-white cursor-pointer">
              <i className="far fa-bell"></i>
            </div>
            <div className="user-avatar-small w-10 h-10 rounded-full bg-[#E0F7FA] text-[#00C2E0] flex items-center justify-center font-bold border border-[#B2EBF2]">
              {avatarInitial}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="content-body px-10 py-8 max-w-5xl">
          <h1 className="view-title text-3xl font-black text-[#00C2E0] flex items-center gap-3 mb-1">
            <i className="far fa-user"></i> Your Profile
          </h1>
          <p className="view-subtitle text-[#64748b] text-base mb-8">
            View and manage your account details and avatar.
          </p>

          {/* Tabs */}
          <div className="tabs-container bg-[#eef2f6] p-1.5 rounded-xl flex gap-1 mb-6">
            <button
              onClick={() => setActiveTab("account")}
              className={`tab-btn flex-1 py-3 border-none rounded-lg font-semibold cursor-pointer transition-all ${activeTab === "account" ? "bg-white text-[#1e293b] shadow-sm" : "bg-transparent text-[#64748b]"}`}
            >
              Account Details
            </button>
            <button
              onClick={() => setActiveTab("avatar")}
              className={`tab-btn flex-1 py-3 border-none rounded-lg font-semibold cursor-pointer transition-all ${activeTab === "avatar" ? "bg-white text-[#1e293b] shadow-sm" : "bg-transparent text-[#64748b]"}`}
            >
              Avatar
            </button>
          </div>

          {/* Profile Card */}
          <div className="profile-card bg-white rounded-2xl border border-[#e2e8f0] p-9 shadow-sm">
            {activeTab === "avatar" ? (
              <>
                <h2 className="section-headline text-2xl font-bold text-[#1e293b] mb-2">
                  Create Your Avatar
                </h2>
                <p className="section-subheadline text-[#64748b] text-sm mb-6">
                  Generate a unique avatar with AI or upload your own picture.
                </p>

                {/* Current Avatar Display */}
                <div className="current-avatar-display border-t border-[#f1f5f9] mt-8 pt-8 mb-8 text-center">
                  <span className="current-label block text-[#64748b] text-sm mb-3">
                    Current
                  </span>
                  <div 
                    className="avatar-circle-large w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold mx-auto shadow-[0_0_0_5px_white,0_4px_15px_rgba(0,0,0,0.05)]"
                    style={{ backgroundColor: avatarColor, color: "#00C2E0" }}
                  >
                    {avatarInitial}
                  </div>
                </div>

                {/* Generation Tools */}
                <div className="gen-tools grid grid-cols-2 gap-10 mt-5">
                  {/* AI Generation */}
                  <div>
                    <h3 className="tool-title text-[#00C2E0] font-bold text-lg mb-4">
                      Generate with AI
                    </h3>
                    <label className="input-label block text-sm font-semibold text-[#1e293b] mb-2">
                      AI Prompt
                    </label>
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g., a happy cartoon robot"
                      className="styled-input w-full px-4 py-3 border border-[#e2e8f0] rounded-xl font-inherit mb-4"
                    />
                    <button
                      onClick={handleGenerateAvatar}
                      disabled={isGenerating}
                      className="btn-generate bg-[#00C2E0] text-white border-none px-4 py-3.5 rounded-xl w-full font-bold flex items-center justify-center gap-2.5 cursor-pointer mt-2.5 hover:bg-[#00A8C2] transition-colors disabled:opacity-70"
                    >
                      <i className="fas fa-wand-magic-sparkles"></i>
                      {isGenerating ? "Generating..." : "Generate"}
                    </button>
                  </div>

                  {/* File Upload */}
                  <div>
                    <h3 className="tool-title text-[#00C2E0] font-bold text-lg mb-4">
                      Upload a Picture
                    </h3>
                    <label className="input-label block text-sm font-semibold text-[#1e293b] mb-2">
                      Image File
                    </label>
                    <div className="file-upload-box border border-[#e2e8f0] rounded-xl p-3 flex items-center gap-2.5 text-[#64748b] text-sm">
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="choose-file-btn border border-[#00C2E0] bg-white text-[#00C2E0] px-4 py-1.5 rounded font-semibold cursor-pointer"
                      >
                        Choose File
                      </label>
                      <span>{uploadedFile ? uploadedFile.name : "No file chosen"}</span>
                    </div>
                    <p className="text-xs text-[#64748b] mt-2">
                      Max file size: 5MB. Supported: JPG, PNG, GIF
                    </p>
                  </div>
                </div>
              </>
            ) : (
              /* Account Details Tab */
              <div>
                <h2 className="section-headline text-2xl font-bold text-[#1e293b] mb-6">
                  Account Details
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="input-label block text-sm font-semibold text-[#1e293b] mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Parent User"
                      className="styled-input w-full px-4 py-3 border border-[#e2e8f0] rounded-xl font-inherit"
                    />
                  </div>
                  <div>
                    <label className="input-label block text-sm font-semibold text-[#1e293b] mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      defaultValue="parent@familytask.com"
                      className="styled-input w-full px-4 py-3 border border-[#e2e8f0] rounded-xl font-inherit"
                    />
                  </div>
                  <div>
                    <label className="input-label block text-sm font-semibold text-[#1e293b] mb-2">
                      Role
                    </label>
                    <div className="styled-input w-full px-4 py-3 border border-[#e2e8f0] rounded-xl font-inherit bg-gray-50">
                      Parent Account
                    </div>
                  </div>
                  <button className="btn-generate bg-[#00C2E0] text-white border-none px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2.5 cursor-pointer mt-6 hover:bg-[#00A8C2] transition-colors">
                    <i className="fas fa-save"></i> Save Changes
                  </button>
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
              alertModal.type === \"success\" ? \"bg-green-100\" :
              alertModal.type === \"error\" ? \"bg-red-100\" :
              alertModal.type === \"warning\" ? \"bg-yellow-100\" :
              \"bg-blue-100\"
            }`}>
              <span className=\"text-3xl\">{
                alertModal.type === \"success\" ? \"✓\" :
                alertModal.type === \"error\" ? \"✕\" :
                alertModal.type === \"warning\" ? \"⚠\" :
                \"ℹ\"
              }</span>
            </div>
            <h3 className={`text-xl font-bold text-center mb-2 ${
              alertModal.type === \"success\" ? \"text-green-600\" :
              alertModal.type === \"error\" ? \"text-red-600\" :
              alertModal.type === \"warning\" ? \"text-yellow-600\" :
              \"text-blue-600\"
            }`}>
              {alertModal.type === \"success\" ? \"Success!\" :
               alertModal.type === \"error\" ? \"Error\" :
               alertModal.type === \"warning\" ? \"Warning\" :
               \"Information\"}
            </h3>
            <p className=\"text-gray-700 text-center mb-6 whitespace-pre-line\">{alertModal.message}</p>
            <button
              onClick={() => setAlertModal({ ...alertModal, show: false })}
              className={`w-full py-3 rounded-xl font-bold text-white transition ${
                alertModal.type === \"success\" ? \"bg-green-500 hover:bg-green-600\" :
                alertModal.type === \"error\" ? \"bg-red-500 hover:bg-red-600\" :
                alertModal.type === \"warning\" ? \"bg-yellow-500 hover:bg-yellow-600\" :
                \"bg-blue-500 hover:bg-blue-600\"
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
            <div className=\"w-16 h-16 rounded-full bg-yellow-100 mx-auto mb-4 flex items-center justify-center\">
              <span className=\"text-3xl\">?</span>
            </div>
            <h3 className=\"text-xl font-bold text-center mb-2 text-gray-800\">Confirm Action</h3>
            <p className=\"text-gray-700 text-center mb-6\">{confirmModal.message}</p>
            <div className=\"flex gap-3\">
              <button
                onClick={() => {
                  setConfirmModal({ show: false, message: \"\", onConfirm: () => {} });
                  if ((window as any)._confirmCancelHandler) {
                    (window as any)._confirmCancelHandler();
                  }
                }}
                className=\"flex-1 py-3 rounded-xl font-bold bg-gray-200 text-gray-700 hover:bg-gray-300 transition\"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className=\"flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white hover:opacity-90 transition\"
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

