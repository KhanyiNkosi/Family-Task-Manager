// app/components/ChildSidebar.tsx - UPDATED with navigation
"use client";

import { useRouter } from "next/navigation";

interface ChildSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function ChildSidebar({ activeView, onViewChange }: ChildSidebarProps) {
  const router = useRouter();

  const handleNavigation = (view: string, path?: string) => {
    if (path) {
      window.location.href = path;
    } else {
      onViewChange(view);
    }
  };

  return (
    <div className="w-64 bg-gradient-to-b from-[#00C2E0] to-[#0099B8] text-white h-screen fixed p-6">
      {/* Logo */}
      <div className="flex items-center gap-3 text-xl font-black mb-10">
        <i className="far fa-smile-beam text-2xl"></i>
        <span>FamilyTask</span>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        <div
          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all ${
            activeView === "home"
              ? "bg-white/20 text-white shadow-lg"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          }`}
          onClick={() => handleNavigation("home")}
        >
          <i className="fas fa-home w-5 text-center"></i>
          <span className="font-semibold">Home</span>
        </div>

        <div
          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all ${
            activeView === "dashboard"
              ? "bg-white/20 text-white shadow-lg"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          }`}
          onClick={() => handleNavigation("dashboard")}
        >
          <i className="fas fa-tachometer-alt w-5 text-center"></i>
          <span className="font-semibold">Dashboard</span>
        </div>

        <div
          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all ${
            activeView === "rewards"
              ? "bg-white/20 text-white shadow-lg"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          }`}
          onClick={() => handleNavigation("rewards", "/rewards-store")}
        >
          <i className="fas fa-gift w-5 text-center"></i>
          <span className="font-semibold">Rewards Store</span>
        </div>

        {/* AI Suggester removed - feature was misleading */}
        {/* <div
          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all ${
            activeView === "ai"
              ? "bg-white/20 text-white shadow-lg"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          }`}
          onClick={() => handleNavigation("ai", "/ai-suggester")}
        >
          <i className="fas fa-brain w-5 text-center"></i>
          <span className="font-semibold">AI Suggester</span>
        </div> */}

        <div
          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all ${
            activeView === "profile"
              ? "bg-white/20 text-white shadow-lg"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          }`}
          onClick={() => handleNavigation("profile", "/profile")}
        >
          <i className="fas fa-user-circle w-5 text-center"></i>
          <span className="font-semibold">Profile</span>
        </div>
      </nav>

      {/* User Info */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <i className="fas fa-child text-white"></i>
          </div>
          <div>
            <p className="font-bold">Child</p>
            <p className="text-white/60 text-sm">120 Points</p>
          </div>
        </div>
      </div>
    </div>
  );
}

