"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Camera, Trash2, User, Save, X } from "lucide-react";

interface ParentProfile {
  name: string;
  email: string;
  role: string;
  profileImage: string;
}

export default function ParentProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<ParentProfile>({
    name: "Parent Account",
    email: "email@example.com",
    role: "Parent",
    profileImage: "",
  });

  // Load the image from localStorage immediately on page load
  useEffect(() => {
    const savedImage = localStorage.getItem("parentProfileImage");
    if (savedImage) {
      setProfile(prev => ({ ...prev, profileImage: savedImage }));
    }
  }, []);

  const handleProfileImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setProfile(prev => ({ ...prev, profileImage: imageUrl }));
        localStorage.setItem("parentProfileImage", imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfilePic = () => {
    if (confirm("Remove profile picture?")) {
      setProfile(prev => ({ ...prev, profileImage: "" }));
      localStorage.removeItem("parentProfileImage");
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#006372] text-white p-6 fixed h-full">
        <div className="text-2xl font-bold mb-10">FamilyTask</div>
        <nav className="space-y-4">
          <Link href="/parent-dashboard" className="block opacity-80 hover:opacity-100">Dashboard</Link>
          <Link href="/parent-profile" className="block font-bold">Profile</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-10 flex flex-col items-center">
        <div className="w-full max-w-2xl mb-8">
          <h1 className="text-3xl font-bold text-[#006372]">My Profile</h1>
        </div>

        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-blue-50 text-center">
          <div className="relative w-40 h-40 mx-auto mb-6">
            {/* The Image Circle */}
            <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-inner">
              {profile.profileImage ? (
                <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={80} className="text-slate-300" />
              )}
            </div>

            {/* Camera Icon Button */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 bg-[#00C2E0] text-white p-3 rounded-full shadow-lg hover:bg-[#00a8c2] transition-colors"
            >
              <Camera size={20} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleProfileImageUpload} 
            />
          </div>

          {/* FIX: The Remove Button is now explicitly rendered here */}
          {profile.profileImage && (
            <button 
              onClick={handleRemoveProfilePic}
              className="mb-8 flex items-center gap-2 mx-auto text-red-500 hover:text-red-600 font-medium transition-colors"
            >
              <Trash2 size={18} /> Remove Profile Picture
            </button>
          )}

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">{profile.name}</h2>
            <p className="text-slate-500">{profile.email}</p>
            <span className="inline-block px-4 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm font-bold">
              {profile.role}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
