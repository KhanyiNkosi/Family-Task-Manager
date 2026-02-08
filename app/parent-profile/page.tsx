"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  User, Mail, Phone, Calendar, Users, CheckCircle, Settings,
  Bell, HelpCircle, LogOut, Camera, Shield, CreditCard,
  MessageSquare, Star, Gift, Target, TrendingUp, Home
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";
import { fetchParentProfileData, fetchParentProfile } from "@/app/lib/profile-data";

interface ParentProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  role: string;
  childrenCount: number;
  totalTasksAssigned: number;
  completedTasks: number;
  profileImage: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
  active?: boolean;
}

export default function ParentProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [tempImage, setTempImage] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ParentProfile>({
    id: "1",
    name: "",
    email: "email@example.com",
    phone: "+1 (555) 123-4567",
    joinDate: "0-01-15",
    role: "Parent",
    childrenCount: 0,
    totalTasksAssigned: 0,
    completedTasks: 0,
    profileImage: "",
  });

  const [editedProfile, setEditedProfile] = useState<ParentProfile>({ ...profile });
  
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
  
  // Load profile image from localStorage on component mount
  useEffect(() => {
    const savedImage = localStorage.getItem("parentProfileImage") || "";
    setProfileImage(savedImage);
    setIsClient(true);
    
    // Fetch profile data from Supabase
    fetchProfileFromSupabase();
  }, []);

  // Fetch profile data from Supabase
  const fetchProfileFromSupabase = async () => {
    try {
      setIsLoading(true);
      
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log("No user session found");
        setIsLoading(false);
        return;
      }
      
      const userId = session.user.id;
      
      // Fetch parent profile from database
      const dbProfile = await fetchParentProfile(userId);
      if (dbProfile) {
        setProfile(prev => ({
          ...prev,
          name: dbProfile.name || "",
          email: dbProfile.email || "",
          phone: dbProfile.phone || "+1 (555) 123-4567",
          role: dbProfile.role === 'parent' ? 'Parent' : 'Family Member',
          profileImage: dbProfile.profile_image || ""
        }));
        
        // If database has profile image, use it
        if (dbProfile.profile_image) {
          setProfileImage(dbProfile.profile_image);
          localStorage.setItem("parentProfileImage", dbProfile.profile_image);
        }
      }
      
      // Fetch profile statistics
      const stats = await fetchParentProfileData(userId);
      setProfile(prev => ({
        ...prev,
        childrenCount: stats.childrenCount,
        totalTasksAssigned: stats.totalTasksAssigned,
        completedTasks: stats.completedTasks,
        joinDate: dbProfile.created_at || prev.joinDate
      }));
      
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation items - Custom for parent-profile
  const navItems: NavItem[] = [
    { href: "/", icon: "fas fa-home", label: "Home" },
    { href: "/parent-dashboard", icon: "fas fa-chart-bar", label: "Dashboard" },
    { href: "/ai-tasks", icon: "fas fa-robot", label: "AI Tasks" },
    { href: "/rewards-store", icon: "fas fa-trophy", label: "Rewards Store" },
    { href: "/ai-suggester", icon: "fas fa-brain", label: "AI Suggester" },
    { href: "/parent-profile", icon: "fas fa-user", label: "Profile", active: true },
  ];

  const handleEdit = () => {
    setEditedProfile({ ...profile });
    setIsEditing(true);
  };

    const handleSave = async () => {
    try {
      console.log("Saving profile...", editedProfile);
      
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw new Error("Cannot get user session");
      }
      
      if (!session?.user) {
        console.error("No user found in session");
        throw new Error("No user logged in");
      }
      
      const userId = session.user.id;
      console.log("Updating user ID:", userId);
      
      // First, check if profiles table exists for this user
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
      
      console.log("Existing profile check:", { existingProfile, fetchError });
      
      // Prepare update data
      const updateData: any = {
        name: editedProfile.name || "",
        email: editedProfile.email || "",
        phone: editedProfile.phone || "",
        updated_at: new Date().toISOString()
      };
      
      // Add profile image if we have one
      if (tempImage) {
        updateData.profile_image = tempImage;
        setProfileImage(tempImage);
        localStorage.setItem("parentProfileImage", tempImage);
      }
      
      console.log("Update data:", updateData);
      
      let updateError;
      
      if (fetchError?.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log("Creating new profile...");
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            ...updateData,
            role: 'parent',
            family_id: 'temp-family-id', // This should come from user metadata
            created_at: new Date().toISOString()
          });
        updateError = createError;
      } else {
        // Update existing profile
        console.log("Updating existing profile...");
        const { error: updateError2 } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);
        updateError = updateError2;
      }
      
      if (updateError) {
        console.error("Database error details:", updateError);
        throw new Error(`Database error: ${updateError.message} (Code: ${updateError.code})`);
      }
      
      // Update local state
      setProfile({ ...editedProfile });
      
      setIsEditing(false);
      showAlert("Profile updated successfully!", "success");
      
      // Refresh data
      fetchProfileFromSupabase();
      
    } catch (error: any) {
      console.error("Detailed save error:", error);
      showAlert(`Error saving profile: ${error.message || "Please try again."}`, "error");
    }
  };

  const handleCancel = () => {
    setTempImage("");
    setIsEditing(false);
  };

  
  const handleInputChange = (field: keyof ParentProfile, value: string) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
  };
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

  // Remove profile picture
  const handleRemoveparentProfileImage = async () => {
    const confirmed = await showConfirm("Remove profile picture?");
    if (confirmed) {
      try {
        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Update database to remove profile image
          const { error } = await supabase
            .from('profiles')
            .update({ profile_image: null })
            .eq('id', session.user.id);
          
          if (error) throw error;
        }
        
        // Update local state
        setProfileImage("");
        localStorage.removeItem("parentProfileImage");
        showAlert("Profile picture removed!", "success");
        
      } catch (error) {
        console.error("Error removing profile image:", error);
        showAlert("Error removing profile picture. Please try again.", "error");
      }
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const completionRate = profile.totalTasksAssigned > 0 
    ? Math.round((profile.completedTasks / profile.totalTasksAssigned) * 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F0F9FF] to-[#D8EEFE] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00C2E0]"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F9FF] to-[#D8EEFE]">
      <div className="flex">
        {/* SIDEBAR - Matches dashboard exactly */}
        <aside className="sidebar bg-gradient-to-b from-[#006372] to-[#004955] text-white w-64 p-6 fixed h-screen">
          {/* Logo - EXACTLY matches dashboard */}
          <div className="logo flex items-center gap-3 text-2xl font-extrabold mb-10">
            <i className="fas fa-smile text-3xl"></i>
            <span>FamilyTask</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-lg transition-all ${
                  pathname === item.href || item.active
                    ? "bg-white/20 text-white shadow-lg"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <i className={`${item.icon} w-5 text-center`}></i>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="mt-auto pt-6 border-t border-white/20 space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white/90 rounded-xl hover:bg-white/20 transition-all font-medium"
            >
              <i className="fas fa-arrow-left"></i>
              Go Back
            </button>

            <button
              onClick={async () => {
                const confirmed = await showConfirm("Are you sure you want to logout?");
                if (confirmed) {
                  await supabase.auth.signOut();
                  sessionStorage.removeItem('userRole');
                  sessionStorage.removeItem('userEmail');
                  sessionStorage.removeItem('userName');
                  router.push('/login');
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 text-red-100 rounded-xl hover:bg-red-500/30 transition-all font-medium border border-red-400/30"
            >
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT - With designed header */}
        <div className="ml-64 flex-1 p-8">
          {/* Designed Header */}
          <header className="mb-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#006372]">My Profile</h1>
                <p className="text-gray-600 mt-2">Manage your personal information and account settings</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#00C2E0] to-[#00a8c2] flex items-center justify-center">
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <i className="fas fa-user text-white text-sm"></i>
                    )}
                  </div>
                  <span className="font-medium text-gray-700">Parent Account</span>
                </div>
                <Link href="/settings">
                <button className="p-3 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                  <i className="fas fa-cog text-gray-600"></i>
                </button>
                </Link>
              </div>
            </div>
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-gradient-to-r from-[#00C2E0] to-[#00a8c2] text-white p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Children</p>
                    <p className="text-2xl font-bold mt-1">{profile.childrenCount}</p>
                  </div>
                  <i className="fas fa-users text-2xl opacity-80"></i>
                </div>
              </div>
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Tasks Completed</p>
                    <p className="text-2xl font-bold mt-1">{profile.completedTasks}</p>
                  </div>
                  <i className="fas fa-check-circle text-2xl opacity-80"></i>
                </div>
              </div>
              <div className="bg-gradient-to-r from-violet-500 to-violet-600 text-white p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Total Points</p>
                    <p className="text-2xl font-bold mt-1">0</p>
                  </div>
                  <i className="fas fa-star text-2xl opacity-80"></i>
                </div>
              </div>
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Member Since</p>
                    <p className="text-2xl font-bold mt-1">0</p>
                  </div>
                  <i className="fas fa-calendar text-2xl opacity-80"></i>
                </div>
              </div>
            </div>
          </header>

          {/* Profile Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100/50">
                <div className="flex flex-col items-center">
                  {/* Profile Picture */}
                  <div className="relative mb-8">
                    <div className="w-40 h-40 rounded-full bg-gradient-to-r from-[#00C2E0] to-[#00a8c2] flex items-center justify-center text-white text-5xl font-bold relative overflow-hidden">
                      {isClient ? (
                        <div className="w-full h-full">
                          {isEditing && tempImage ? (
                            <img 
                              src={tempImage} 
                              alt="Preview" 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : profileImage ? (
                            <img 
                              src={profileImage} 
                              alt="Profile" 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <i className="fas fa-user text-white text-5xl"></i>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <i className="fas fa-user text-white text-5xl"></i>
                        </div>
                      )}
                      
                      {/* Edit overlay when in edit mode */}
                      {isEditing && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                          <label className="cursor-pointer p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors">
                            <i className="fas fa-camera text-gray-700 text-xl"></i>
                            <input
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept="image/*"
                              onChange={handleFileUpload}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    
                    {/* Edit button when not in edit mode */}
                    {!isEditing && (
                      <button
                       onClick={triggerFileInput}
                        className="absolute bottom-3 right-3 bg-white p-2 rounded-full shadow-lg hover:shadow-xl transition-shadow"
                        title="Change photo"
                      >
                        <Camera size={20} className="text-gray-700"/>
                      </button>
                    )}
                  </div>

                  {!isEditing && profileImage && (
                    <button
                      onClick={handleRemoveparentProfileImage}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 mb-6"
                    >
                      <i className="fas fa-trash"></i>
                      Remove Profile Picture
                    </button>
                  )}

                  <h2 className="text-2xl font-bold text-[#006372]">{profile.name || "Parent User"}</h2>
                  <p className="text-gray-600 mt-1 flex items-center gap-2">
                    <i className="fas fa-user-tag text-blue-500"></i>
                    {profile.role}
                  </p>
                  <p className="text-gray-500 text-sm mt-2 flex items-center gap-2">
                    <i className="fas fa-envelope"></i>
                    {profile.email}
                  </p>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mt-6 w-full">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100">
                      <p className="text-2xl font-bold text-[#006372]">{profile.childrenCount}</p>
                      <p className="text-sm text-gray-600 mt-1">Children</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100">
                      <p className="text-2xl font-bold text-green-600">{completionRate}%</p>
                      <p className="text-sm text-gray-600 mt-1">Completion Rate</p>
                    </div>
                  </div>

                  {/* Edit/Save Button */}
                  {!isEditing ? (
                    <button
                      onClick={handleEdit}
                      className="mt-5 w-full bg-gradient-to-r from-[#00C2E0] to-[#00a8c2] text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-edit"></i>
                      Edit Profile
                    </button>
                  ) : (
                    <div className="mt-6 w-full grid grid-cols-2 gap-4">
                      <button
                        onClick={handleSave}
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-3"
                      >
                        <i className="fas fa-save"></i>
                        Save Changes
                      </button>
                      
                      <button
                        onClick={handleCancel}
                        className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-all flex items-center justify-center gap-2 border border-gray-300"
                      >
                        <i className="fas fa-times"></i>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Profile Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Personal Information Card */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100/50">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-[#006372]">Personal Information</h3>
                  <div className="flex items-center gap-2 text-[#006372]">
                    <i className="fas fa-id-card"></i>
                    <span className="text-sm font-medium">Details</span>
                  </div>
                </div>
                
                {isEditing ? (
                  /* EDIT MODE */
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={editedProfile.name}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full p-4 border border-[#00C2E0]/30 rounded-xl focus:ring-2 focus:ring-[#00C2E0] focus:border-[#00C2E0] focus:border-transparent"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={editedProfile.email}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full p-4 border border-[#00C2E0]/30 rounded-xl focus:ring-2 focus:ring-[#00C2E0] focus:border-[#00C2E0] focus:border-transparent"
                          placeholder="Enter your email"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={editedProfile.phone}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full p-4 border border-[#00C2E0]/30 rounded-xl focus:ring-2 focus:ring-[#00C2E0] focus:border-[#00C2E0] focus:border-transparent"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* VIEW MODE */
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="p-5 bg-gradient-to-br from-blue-50/50 to-white rounded-xl border border-blue-100/50">
                        <div className="flex items-center gap-3 mb-2">
                          <User size={0} className="text-[#00C2E0]" />
                          <span className="text-sm font-medium text-[#00C2E0]">Full Name</span>
                        </div>
                        <p className="text-lg font-semibold text-[#006372]">{profile.name || "Not set"}</p>
                      </div>
                      <div className="p-5 bg-gradient-to-br from-blue-50/50 to-white rounded-xl border border-blue-100/50">
                        <div className="flex items-center gap-3 mb-2">
                          <Mail size={0} className="text-[#00C2E0]" />
                          <span className="text-sm font-medium text-[#00C2E0]">Email</span>
                        </div>
                        <p className="text-lg font-semibold text-[#006372]">{profile.email}</p>
                      </div>
                      <div className="p-5 bg-gradient-to-br from-blue-50/50 to-white rounded-xl border border-blue-100/50">
                        <div className="flex items-center gap-3 mb-2">
                          <Phone size={0} className="text-[#00C2E0]" />
                          <span className="text-sm font-medium text-[#00C2E0]">Phone</span>
                        </div>
                        <p className="text-lg font-semibold text-[#006372]">{profile.phone}</p>
                      </div>
                      <div className="p-5 bg-gradient-to-br from-blue-50/50 to-white rounded-xl border border-blue-100/50">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar size={0} className="text-[#00C2E0]" />
                          <span className="text-sm font-medium text-[#00C2E0]">Member Since</span>
                        </div>
                        <p className="text-lg font-semibold text-[#006372]">
                          {profile.joinDate ? new Date(profile.joinDate).toLocaleDateString() : "Not set"}
                        </p>
                      </div>
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                      <div className="p-5 bg-gradient-to-br from-blue-50/80 to-blue-100/30 rounded-xl border border-blue-200/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-700">Total Tasks Assigned</p>
                            <p className="text-2xl font-bold text-blue-800 mt-1">{profile.totalTasksAssigned}</p>
                          </div>
                          <CheckCircle size={0} className="text-blue-500" />
                        </div>
                      </div>
                      <div className="p-5 bg-gradient-to-br from-green-50/80 to-green-100/30 rounded-xl border border-green-200/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-700">Completed Tasks</p>
                            <p className="text-2xl font-bold text-green-800 mt-1">{profile.completedTasks}</p>
                          </div>
                          <Users size={0} className="text-green-500" />
                        </div>
                      </div>
                      <div className="p-5 bg-gradient-to-br from-purple-50/80 to-purple-100/30 rounded-xl border border-purple-200/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-purple-700">Completion Rate</p>
                            <p className="text-2xl font-bold text-purple-800 mt-1">{completionRate}%</p>
                          </div>
                          <TrendingUp size={0} className="text-purple-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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


