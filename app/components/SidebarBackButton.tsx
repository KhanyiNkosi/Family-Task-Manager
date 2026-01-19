// app/components/SidebarBackButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface SidebarBackButtonProps {
  label?: string;
  className?: string;
}

export default function SidebarBackButton({ label = "Back", className = "" }: SidebarBackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <button
      onClick={handleBack}
      className={`
        sidebar-back-button
        flex items-center gap-3
        bg-white/10 hover:bg-white/20
        text-white hover:text-white
        border border-white/20 hover:border-white/30
        px-4 py-2.5 rounded-lg
        font-medium text-sm
        backdrop-blur-sm
        transition-all duration-300
        w-full
        ${className}
      `}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
