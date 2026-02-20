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
  const [profileStorageKey, setProfileStorageKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ParentProfile>({
    id: "1",
    name: "",
    email: "email@example.com",
    phone: "",
    joinDate: "0-01-15",
    role: "Parent",
    childrenCount: 0,
    totalTasksAssigned: 0,
    completedTasks: 0,
    profileImage: "",
  });

  const [editedProfile, setEditedProfile] = useState<ParentProfile>({ ...profile });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Family members management states
  const [familyMembers, setFamilyMembers] = useState<Array<{id: string, full_name: string, email: string, role: string, points: number}>>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{id: string, full_name: string, email: string} | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
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
  
  // Load profile data on component mount
  useEffect(() => {
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
      const storageKey = `parentProfileImage:${userId}`;
      setProfileStorageKey(storageKey);

      const cachedImage = localStorage.getItem(storageKey) || "";
      if (cachedImage) {
        setProfileImage(cachedImage);
      }
      
      // Fetch parent profile from database
      const dbProfile = await fetchParentProfile(userId);
      if (dbProfile) {
        setProfile(prev => ({
          ...prev,
          name: dbProfile.full_name || "",
          email: dbProfile.email || "",
          phone: dbProfile.phone || "",
          role: dbProfile.role === 'parent' ? 'Parent' : 'Family Member',
          profileImage: dbProfile.profile_image || ""
        }));
        
        // If database has profile image, use it
        if (dbProfile.profile_image) {
          setProfileImage(dbProfile.profile_image);
          localStorage.setItem(storageKey, dbProfile.profile_image);
        } else {
          setProfileImage("");
          localStorage.removeItem(storageKey);
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

  // Fetch family members
  const fetchFamilyMembers = async () => {
    try {
      setLoadingMembers(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Get current user's family_id
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', session.user.id)
        .single();

      if (!userProfile?.family_id) return;

      // Get all family members
      const { data: members } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at')
        .eq('family_id', userProfile.family_id)
        .order('role', { ascending: false }) // Parents first
        .order('created_at', { ascending: true });

      if (members) {
        // Calculate points for each member
        const membersWithPoints = await Promise.all(
          members.map(async (member) => {
            // Calculate points from approved tasks
            const { data: approvedTasks } = await supabase
              .from('tasks')
              .select('points')
              .eq('assigned_to', member.id)
              .eq('approved', true);
            
            const earnedPoints = approvedTasks?.reduce((sum, task) => sum + (task.points || 0), 0) || 0;
            
            // Calculate points spent on APPROVED redemptions
            const { data: redemptions } = await supabase
              .from('reward_redemptions')
              .select('points_spent')
              .eq('user_id', member.id)
              .eq('status', 'approved');
            
            const spentPoints = redemptions?.reduce((sum, r) => sum + (r.points_spent || 0), 0) || 0;
            const currentPoints = earnedPoints - spentPoints;

            return {
              ...member,
              points: currentPoints
            };
          })
        );
        
        setFamilyMembers(membersWithPoints);
      }
    } catch (error) {
      console.error('Error fetching family members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Delete family member
  const handleDeleteMember = (member: {id: string, full_name: string, email: string}) => {
    setMemberToDelete(member);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;
    
    try {
      // Delete the member's profile (CASCADE will delete related data)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', memberToDelete.id);
      
      if (error) {
        console.error('Error deleting family member:', error);
        showAlert('Failed to delete family member. Please try again.', 'error');
        return;
      }
      
      // Refresh the list
      await fetchFamilyMembers();
      
      // Close modal
      setShowDeleteConfirm(false);
      setMemberToDelete(null);
      
      showAlert(`${memberToDelete.full_name} has been removed from the family.`, 'success');
    } catch (error) {
      console.error('Error deleting family member:', error);
      showAlert('An error occurred while deleting the family member.', 'error');
    }
  };

  const cancelDeleteMember = () => {
    setShowDeleteConfirm(false);
    setMemberToDelete(null);
  };

  // Load family members when component mounts
  useEffect(() => {
    if (!isLoading) {
      fetchFamilyMembers();
    }
  }, [isLoading]);

  // Navigation items - Custom for parent-profile
  const navItems: NavItem[] = [
    { href: "/", icon: "fas fa-home", label: "Home" },
    { href: "/parent-dashboard", icon: "fas fa-chart-bar", label: "Dashboard" },
    // AI features temporarily disabled - coming soon with full implementation
    // { href: "/ai-tasks", icon: "fas fa-robot", label: "AI Tasks" },
    // { href: "/ai-suggester", icon: "fas fa-brain", label: "AI Suggester" },
    { href: "/rewards-store", icon: "fas fa-trophy", label: "Rewards Store" },
    { href: "/parent-profile", icon: "fas fa-user", label: "Profile", active: true },
  ];


  const handleEdit = () => {
    setEditedProfile({ ...profile });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        showAlert("Cannot get user session", "error");
        return;
      }
      if (!session?.user) {
        showAlert("No user logged in", "error");
        return;
      }
      const userId = session.user.id;
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
      const updateData = {
        full_name: editedProfile.name || "",
        email: editedProfile.email || "",
        phone: editedProfile.phone || "",
        updated_at: new Date().toISOString(),
        profile_image: tempImage ? tempImage : (profileImage || null)
      };
      let updateError;
      if (fetchError?.code === 'PGRST116') {
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            ...updateData,
            role: 'parent',
            family_id: 'temp-family-id',
            created_at: new Date().toISOString()
          });
        updateError = createError;
      } else {
        const { error: updateError2 } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);
        updateError = updateError2;
      }
      if (updateError) {
        showAlert(`Database error: ${updateError.message || "Unknown error"}`, "error");
        return;
      }
      const storageKey = profileStorageKey || `parentProfileImage:${userId}`;
      if (updateData.profile_image) {
        setProfileImage(updateData.profile_image);
        localStorage.setItem(storageKey, updateData.profile_image);
      } else {
        setProfileImage("");
        localStorage.removeItem(storageKey);
      }
      setProfile({ ...editedProfile });
      setIsEditing(false);
      showAlert("Profile updated successfully!", "success");
      fetchProfileFromSupabase();
    } catch (error: any) {
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
      // Check file size (warn if > 500KB, reject if > 2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB
      const warnSize = 500 * 1024; // 500KB
      
      if (file.size > maxSize) {
        showAlert(`Image too large! Maximum size is 2MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB. Please compress or resize the image.`, "error");
        return;
      }
      
      if (file.size > warnSize) {
        showAlert(`⚠️ Large image detected (${(file.size / 1024).toFixed(0)}KB). For best performance, we recommend images under 500KB. Consider compressing before uploading.`, "warning");
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setTempImage(result);
        setIsEditing(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveparentProfileImage = async () => {
    const confirmed = await showConfirm("Remove profile picture?");
    if (confirmed) {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          showAlert("Cannot get user session", "error");
          return;
        }
        if (session?.user) {
          const { error } = await supabase
            .from('profiles')
            .update({ profile_image: null })
            .eq('id', session.user.id);
          if (error) {
            showAlert("Error removing profile picture in database.", "error");
            return;
          }
        }
        const storageKey = profileStorageKey || `parentProfileImage:${session?.user?.id || ""}`;
        setProfileImage("");
        if (storageKey !== "parentProfileImage:") {
          localStorage.removeItem(storageKey);
        }
        showAlert("Profile picture removed!", "success");
      } catch (error) {
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
        <aside className="sidebar hidden lg:flex flex-col bg-gradient-to-b from-[#006372] to-[#004955] text-white w-64 p-6 fixed h-screen">
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
        <div className="lg:ml-64 flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Mobile Hamburger Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
              <div className="w-64 h-full bg-gradient-to-b from-[#006372] to-[#004955] text-white p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3 text-2xl font-extrabold">
                    <i className="fas fa-smile text-3xl"></i>
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
                <div className="mt-auto pt-6 border-t border-white/20 space-y-3 absolute bottom-6 left-6 right-6">
                  <button
                    onClick={() => { window.history.back(); setMobileMenuOpen(false); }}
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
                        if (profileStorageKey) {
                          localStorage.removeItem(profileStorageKey);
                        }
                        router.push('/');
                      }
                      setMobileMenuOpen(false);
                    }}
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
              onClick={async () => {
                const confirmed = await showConfirm("Are you sure you want to logout?");
                if (confirmed) {
                  await supabase.auth.signOut();
                  sessionStorage.removeItem('userRole');
                  sessionStorage.removeItem('userEmail');
                  sessionStorage.removeItem('userName');
                  if (profileStorageKey) {
                    localStorage.removeItem(profileStorageKey);
                  }
                  router.push('/');
                }
              }}
              className="px-3 py-1 bg-white/20 rounded-lg text-sm"
            >
              Logout
            </button>
          </div>
          
          {/* Designed Header */}
          <header className="mb-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#006372]">My Profile</h1>
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
                    <p className="text-sm opacity-90">Tasks Assigned</p>
                    <p className="text-2xl font-bold mt-1">{profile.totalTasksAssigned}</p>
                  </div>
                  <i className="fas fa-tasks text-2xl opacity-80"></i>
                </div>
              </div>
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Member Since</p>
                    <p className="text-lg font-bold mt-1">{new Date(profile.joinDate).getFullYear()}</p>
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
                    
                    {/* Family Members Management Section */}
                    {!isEditing && (
                      <div className="mt-8 bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold text-[#006372] flex items-center gap-2">
                            <Users size={24} className="text-[#00C2E0]" />
                            Family Members Management
                          </h3>
                          <button
                            onClick={fetchFamilyMembers}
                            className="px-4 py-2 bg-[#00C2E0]/10 text-[#00C2E0] rounded-lg text-sm font-medium hover:bg-[#00C2E0]/20 transition-colors flex items-center gap-2"
                            title="Refresh list"
                          >
                            <i className="fas fa-sync-alt"></i>
                            Refresh
                          </button>
                        </div>

                        {loadingMembers ? (
                          <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C2E0]"></div>
                            <p className="text-gray-600 mt-2">Loading family members...</p>
                          </div>
                        ) : familyMembers.length === 0 ? (
                          <div className="text-center py-8">
                            <Users size={48} className="text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-600">No family members found</p>
                            <p className="text-sm text-gray-500 mt-1">Invite children to join your family</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {familyMembers.map((member) => (
                              <div
                                key={member.id}
                                className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/50 to-white rounded-xl border border-blue-100/50 hover:shadow-md transition-all"
                              >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
                                    member.role === 'parent' 
                                      ? 'bg-gradient-to-r from-purple-500 to-purple-600' 
                                      : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                                  }`}>
                                    {member.full_name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-bold text-gray-800 truncate">{member.full_name}</p>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        member.role === 'parent'
                                          ? 'bg-purple-100 text-purple-700'
                                          : 'bg-cyan-100 text-cyan-700'
                                      }`}>
                                        {member.role === 'parent' ? '👔 Parent' : '👶 Child'}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 truncate">{member.email}</p>
                                  </div>
                                  <div className="flex items-center gap-3 flex-shrink-0">
                                    {member.role === 'child' && (
                                      <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-bold flex items-center gap-1">
                                        <i className="fas fa-star text-amber-500"></i>
                                        {member.points}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => handleDeleteMember(member)}
                                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Remove family member"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-sm text-blue-800">
                            <i className="fas fa-info-circle mr-2"></i>
                            <strong>Note:</strong> Deleting a family member will permanently remove their profile, tasks, points, achievements, and all activity history. This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && memberToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Remove Family Member?</h3>
              <p className="text-gray-600">
                Are you sure you want to remove <span className="font-bold text-gray-800">{memberToDelete.full_name}</span> from your family?
              </p>
              <p className="text-sm text-red-600 mt-3">
                ⚠️ This will permanently delete:
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1 text-left">
                <li>• Their profile and account</li>
                <li>• All their tasks (pending and completed)</li>
                <li>• Their points and achievements</li>
                <li>• All their activity history</li>
              </ul>
              <p className="text-sm font-bold text-red-600 mt-3">
                This action cannot be undone!
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={cancelDeleteMember}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteMember}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

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


