// components/Sidebar.tsx - Simple sidebar for layout
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  
  const navItems = [
    { name: "Home", icon: "fas fa-home", path: "/" },
    { name: "Child Dashboard", icon: "fas fa-child", path: "/child-dashboard" },
    { name: "Parent Dashboard", icon: "fas fa-user-friends", path: "/parent-dashboard" },
    { name: "AI Suggester", icon: "fas fa-robot", path: "/ai-suggester" },
    { name: "Rewards Store", icon: "fas fa-gift", path: "/rewards-store" },
    { name: "Profile", icon: "fas fa-user", path: "/profile" },
    { name: "About", icon: "fas fa-info-circle", path: "/about" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    return pathname.startsWith(path) && path !== "/";
  };

  return (
    <aside className="w-[260px] bg-gradient-to-b from-[#006372] to-[#004955] text-white h-screen fixed p-6">
      {/* Logo */}
      <div className="flex items-center gap-3 text-2xl font-extrabold mb-10">
        <i className="fas fa-smile text-3xl"></i>
        <span>FamilyTask</span>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.path}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all ${
              isActive(item.path)
                ? "bg-white/20 text-white shadow-lg"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <i className={`${item.icon} w-5 text-center`}></i>
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom Go Back Button */}
      <div className="mt-auto pt-6 border-t border-white/20">
        <button
          onClick={() => window.history.back()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white/90 rounded-xl hover:bg-white/20 transition-all font-medium"
        >
          <i className="fas fa-arrow-left"></i>
          Go Back
        </button>
      </div>
    </aside>
  );
}
